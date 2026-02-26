# Shadow-KYC

A privacy-preserving KYC (Know Your Customer) system built on zero-knowledge proofs. Users verify their identity using Aadhaar offline XML, generate a ZK proof of their credentials, and store an on-chain record tied to their wallet — without ever revealing raw identity data. Raw KYC documents and photos are kept privately in a **DataHaven StorageHub bucket** owned by the user's wallet, while only the cryptographic ZK proof is published on-chain.

---

## Architecture Overview

The frontend talks to three backends simultaneously — the Node.js backend for ZK proof generation, the Python backend for Aadhaar XML parsing, and **DataHaven StorageHub** directly for private decentralized file storage. After Aadhaar verification and face matching, the Node.js backend produces a Groth16 ZK proof that is submitted on-chain to the `ZKProofStorage` contract on Sepolia. In parallel, the raw KYC data (Aadhaar fields + face photos) is encrypted and stored in a **private, wallet-owned DataHaven bucket** on the StorageHub network — meaning only the wallet owner can access their own identity documents. The ZK circuit itself lives in the `zkp/` directory and is compiled with Circom.

### What goes where

| Data | Storage | Why |
|------|---------|-----|
| Raw Aadhaar fields + photos (JSON) | DataHaven private bucket | Sensitive personal data — owner-only access |
| Groth16 ZK proof (`pi_a, pi_b, pi_c`) | Sepolia on-chain | Public, tamper-proof, wallet-bound |
| Aadhaar credential hash | Sepolia on-chain (publicSignals[2]) | Hashed — no raw data exposed |

---

## Project Structure

| Directory | Stack | Purpose |
|-----------|-------|---------|
| `kyc_frontend/` | React + TypeScript + Vite | User-facing web app (incl. DataHaven client) |
| `backend/` | Node.js + Express + TypeScript | ZK proof generation & credential issuance |
| `kyc_backend/` | Python + FastAPI | Aadhaar XML parsing & face matching |
| `shadow_kyc/` | Solidity + Hardhat | Smart contracts (Sepolia) |
| `zkp/` | Circom + snarkjs | ZK circuit, proving keys, witness generation |

**Frontend DataHaven service files** (`kyc_frontend/src/`):

- `config/networks.ts` — DataHaven devnet + testnet RPC/WS/MSP endpoints
- `services/clientService.ts` — StorageHubClient, wallet, Polkadot API init
- `services/mspService.ts` — MSP connection + SIWE authentication
- `services/storageService.ts` — High-level `storeKycDataOnDataHaven()` wrapper
- `services/contractStorageService.ts` — ZKProofStorage contract (Sepolia) read/write
- `operations/bucketOperations.ts` — `createBucket()`, `getBucket()`, `waitForBackendBucketReady()`
- `operations/fileOperations.ts` — `uploadFile()`, `downloadFile()`, `waitForMSPConfirmOnChain()`

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | https://nodejs.org |
| Python | ≥ 3.9 | https://python.org |
| Bun | latest | `npm i -g bun` |
| Hardhat | bundled | via `npm install` |
| Circom | ≥ 2.0 | https://docs.circom.io |

---

## 1. DataHaven Bucket Storage

Raw KYC data (Aadhaar fields + face photos) is stored off-chain in a **private, wallet-owned bucket** on the DataHaven StorageHub network. Only the bucket owner can read or write files.

### Network Config (`kyc_frontend/src/config/networks.ts`)

| Property | Devnet | Testnet |
|----------|--------|---------|
| Chain ID | `181222` | `55931` |
| RPC URL | `http://127.0.0.1:9666` | `https://services.datahaven-testnet.network/testnet` |
| WebSocket | `ws://127.0.0.1:9666` | `wss://services.datahaven-testnet.network/testnet` |
| MSP URL | `http://127.0.0.1:8080/` | `https://deo-dh-backend.testnet.datahaven-infra.network/` |
| Native Token | `SH` | `MOCK` |
| Filesystem Contract | `0x...0064` | `0x...0404` |

> Active network is controlled by `NETWORK = NETWORKS.testnet` in `networks.ts`.

### Storage Flow

1. `connectWallet()` — connect MetaMask / EVM wallet
2. `initPolkadotApi()` — open WebSocket to DataHaven chain for on-chain queries
3. `connectToMsp()` — HTTP handshake with the Managed Storage Provider
4. `authenticateUser()` — SIWE (Sign-In With Ethereum) to prove wallet ownership
5. `createBucket(walletAddr)` — create a private bucket; ID is derived from wallet address. If bucket already exists, the ID is rederived and reused.
6. `waitForBackendBucketReady()` — poll until MSP indexes the new bucket
7. `uploadFile(bucketId, kycJson)` — issue on-chain storage request then upload file to MSP
8. `waitForMSPConfirmOnChain()` — poll until MSP confirms file acceptance on-chain

### What is stored in the bucket

Each upload is a JSON file named `kyc-data-<timestamp>.json` containing three top-level keys:

- `aadhaarData` — original ZIP filename, upload timestamp, and extracted fields (name, DOB, gender, state)
- `images` — base64-encoded Aadhaar photo, live camera capture, and passport photo
- `metadata` — ISO timestamp, schema version (`2.0`), and owner wallet address

Files are stored inside the user's private bucket, accessible only by the bucket owner.

### Key Functions

| Function | File | Description |
|----------|------|-------------|
| `storeKycDataOnDataHaven()` | `storageService.ts` | Orchestrates the full upload flow |
| `createBucket(name, isPrivate)` | `bucketOperations.ts` | Creates private bucket on-chain |
| `uploadFile(bucketId, file)` | `fileOperations.ts` | Issues storage request + uploads to MSP |
| `waitForMSPConfirmOnChain()` | `fileOperations.ts` | Polls chain until MSP confirms |
| `authenticateUser()` | `mspService.ts` | SIWE auth for MSP access |
| `connectWallet()` | `clientService.ts` | MetaMask wallet + StorageHubClient init |

### Dependencies (frontend)

- `@storagehub-sdk/core` ^0.4.4
- `@storagehub-sdk/msp-client` ^0.4.4
- `@storagehub/api-augment` ^0.4.0
- `@storagehub/types-bundle` ^0.4.0
- `@polkadot/api` ^16.5.4
- `@polkadot/util-crypto` ^14.0.1

---

## 2. Smart Contract — `shadow_kyc/`

The `ZKProofStorage` contract stores a Groth16 proof object on-chain, permanently bound to a wallet address.

### Contract: `contracts/zk.sol`

The `ZKProof` struct stores `pi_a` (2 elements), `pi_b` (2×2 elements), `pi_c` (2 elements), `publicSignals` (3 elements: statusBits, KYC level, credentialHash), a `bytes32 credentialHash`, a Unix `timestamp`, and string fields for `algorithm` and `curve`. Every address maps to exactly one struct via `mapping(address => ZKProof) public userProofs`.

Key properties:
- **Write-once / read-many** — no delete functions. Records are permanent.
- `storeProof()` — stores a full Groth16 proof linked to `msg.sender`
- `getMyProof()` — returns caller's stored proof
- `getProof(address)` — returns any user's proof (public data)

### Setup

Run `npm install` inside `shadow_kyc/`. Create a `.env` file with `PRIVATE_KEY` (your deployer wallet private key) and `SEPOLIA_RPC_URL` (e.g. from Infura or Alchemy).

### Compile & Deploy

Run `npx hardhat compile` to compile, then `npx hardhat run scripts/deployZKProof.js --network sepolia` to deploy. Deployment output including the contract address is saved to `deployment-info.json`.

### Contract ABI

After compiling, the ABI is generated at `shadow_kyc/artifacts-zk/contracts/zk.sol/ZKProofStorage.json`.

---

## 3. ZK Circuit — `zkp/`

The `kyc.circom` circuit enforces KYC rules using Poseidon hashing and EdDSA signature verification. The output is a Groth16 proof.

### Structure

- `circuits/kyc.circom` — main Circom circuit
- `build/kyc.r1cs` — compiled R1CS constraint system
- `build/kyc_js/` — WASM witness generator
- `zkey/kyc_final.zkey` — proving key
- `zkey/verification_key.json` — verification key
- `proof/proof.json` — example generated proof
- `proof/public.json` — public signals output
- `witness/input.json` — example circuit inputs

### Proof Format (Groth16 / bn128)

The proof object contains `pi_a` (3 elements), `pi_b` (3×2 elements), `pi_c` (3 elements), `publicSignals` (3 elements), plus `algorithm: "Groth16"` and `curve: "bn128"`.

**publicSignals explained:**
| Index | Meaning |
|-------|---------|
| `[0]` | Status bits (age, govtId, face, liveness as bitmask) |
| `[1]` | KYC level (e.g., `3` = level 3 verified) |
| `[2]` | Poseidon credential hash |

### Install & Run

Run `npm install` inside `zkp/`. Use `node issuerKeygen.js` to generate issuer keys and `node signCredential.js` to sign a credential.

---

## 4. Node.js Backend — `backend/`

Handles ZK proof generation using snarkjs, credential issuance with EdDSA Poseidon signing, and proof verification for banks/third parties.

### Setup

Run `npm install` inside `backend/`. Create a `.env` file with `ISSUER_PRIVATE_KEY` (hex private key for EdDSA signing) and `PORT` (default `3000`).

### Run

Development: `npm run dev` (hot reload via ts-node-dev). Production: `npm run build` then `npm start`. Server runs on `http://localhost:3000`.

### API Endpoints

#### `POST /kyc/submit` — Issue Credential + Generate ZK Proof

Request body: `ageNatOK`, `govtIdOK`, `faceOK`, `livenessOK` (each `0` or `1`). Returns a full Groth16 proof object (`pi_a`, `pi_b`, `pi_c`), `publicSignals` array (`[statusBits, level, credentialHash]`), `algorithm`, and `curve`.

#### `POST /bank/verify` — Verify a Proof

Request body: `proof` object and `publicSignals` array. Returns `{ "verified": true }` or `false`.

---

## 5. Python Backend — `kyc_backend/`

Handles Aadhaar offline XML parsing, photo extraction, and face matching. Accepts Aadhaar ZIP file URLs (e.g., from UIDAI offline eKYC download).

### Setup

Run `pip install -r requirements.txt` inside `kyc_backend/`.

### Run

Development: `python run.py`. Or directly: `uvicorn main:app --reload --host 127.0.0.1 --port 8000`. API available at `http://127.0.0.1:8000`, Swagger docs at `http://127.0.0.1:8000/docs`.

### API Endpoints

#### `POST /extract-aadhaar-from-url` — Parse Aadhaar from ZIP URL

Request body: `zip_url` (URL to the Aadhaar offline ZIP) and `share_code`. Returns full Aadhaar data including a base64-encoded photo.

#### `GET /health` — Service Health Check

---

## 6. Frontend — `kyc_frontend/`

React + TypeScript web app. Handles wallet connection, Aadhaar upload, ZK proof flow, and on-chain credential display.

### Setup

Run `npm install` (or `bun install`) inside `kyc_frontend/`.

### Run

Development: `npm run dev` or `bun dev`. Frontend runs on `http://localhost:8080`. Production build: `npm run build`.

### Key Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `Index.tsx` | Landing page |
| `/kyc` | `KYCDashboard.tsx` | Full KYC submission flow |
| `/profile` | `Profile.tsx` | User's stored credentials |
| `/zkproof` | `ZKProof.tsx` | View generated ZK proof |

### Key Components

- `WalletConnect.tsx` — MetaMask wallet connection
- `AadhaarUploadSteps.tsx` — Step-by-step Aadhaar upload
- `FaceVerification.tsx` — Live face matching via `face-api.js`
- `KYCSubmissionForm.tsx` — Full KYC form orchestration
- `CredentialDisplay.tsx` — Display on-chain ZK proof data
- `BankVerification.tsx` — Third-party proof verification view

### Environment Variables

Create `kyc_frontend/.env` with:
- `VITE_CONTRACT_ADDRESS` — deployed `ZKProofStorage` address on Sepolia
- `VITE_BACKEND_URL` — Node.js backend URL (default `http://localhost:3000`)
- `VITE_KYC_BACKEND_URL` — Python backend URL (default `http://localhost:8000`)

---

## Full Local Setup (All Services)

Open four terminals and run each in parallel:

1. Python KYC backend — `cd kyc_backend && python run.py`
2. Node.js backend — `cd backend && npm run dev`
3. Frontend — `cd kyc_frontend && npm run dev`
4. (Optional) Hardhat local node — `cd shadow_kyc && npx hardhat node`

---

## KYC Flow (End to End)

1. User connects MetaMask wallet
2. User uploads Aadhaar offline ZIP — `kyc_backend` parses the XML and extracts identity fields and photo
3. `FaceVerification` matches live camera capture against the Aadhaar photo using `face-api.js`
4. `backend/kyc/submit` runs the circuit witness, generates a Groth16 proof, and issues a signed credential
5. Two parallel write operations:
   - **On Sepolia** — `storeProof()` transaction stores `pi_a`, `pi_b`, `pi_c`, `publicSignals`, and `credentialHash` permanently on-chain, bound to the wallet address
   - **On DataHaven** — `storeKycDataOnDataHaven()` authenticates via SIWE, creates a private bucket keyed by wallet address, and uploads the full KYC JSON (Aadhaar fields + photos)
6. Both storage targets confirmed: ZK proof on Sepolia, raw KYC data in DataHaven private bucket
7. Banks and verifiers call `getProof(address)` on Sepolia to validate the KYC level without accessing any personal data

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| State | TanStack Query, React Hook Form |
| Web3 (EVM) | ethers.js v5, viem v2, thirdweb SDK, MetaMask |
| Web3 (Substrate) | @polkadot/api, @storagehub-sdk/core, @storagehub-sdk/msp-client |
| Decentralized Storage | DataHaven StorageHub Testnet (Chain ID: 55931) |
| ZK Proofs | Circom 2, snarkjs (Groth16), bn128 curve |
| Node Backend | Express 5, TypeScript, snarkjs, circomlibjs |
| Python Backend | FastAPI, uvicorn, lxml |
| Smart Contracts | Solidity ^0.8.20, Hardhat |
| Blockchain (proofs) | Sepolia Testnet (Chain ID: 11155111) |

---
