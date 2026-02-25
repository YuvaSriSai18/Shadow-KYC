# KYC ZK Backend Server

A Node.js + Express backend for KYC credential issuance with Groth16 zero-knowledge proofs using snarkjs.

## Features

- **KYC Credential Issuance**: Issues credentials based on verification flags (age, govt ID, face, liveness)
- **ZK Proof Generation**: Generates Groth16 proofs using snarkjs
- **Proof Verification**: Banks can verify proofs and check specific credential flags
- **Poseidon Hashing**: Uses Poseidon hash for credential hashing
- **EdDSA Signing**: Signs credentials using EdDSA Poseidon signatures

## Project Structure

```
/server
  ├── app.js                      # Main Express app
  ├── package.json                # Dependencies
  ├── .env                        # Environment variables
  ├── routes/
  │     ├── kyc.js               # KYC submission endpoint
  │     └── bank.js              # Proof verification endpoint
  ├── zk/
  │     ├── Progressive_KYC.wasm        # Circuit WASM
  │     ├── Progressive_KYC_final.zkey  # Proving key
  │     └── verification_key.json       # Verification key
  ├── utils/
  │     ├── poseidon.js           # Poseidon hash utility
  │     ├── issuer.js             # EdDSA signing utility
  │     └── prover.js             # Proof generation utility
  └── data/
        └── users.json            # Simple user storage
```

## Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Edit `.env`:

```env
ISSUER_PRIVATE_KEY=your_hex_private_key_here
PORT=3000
```

### 3. Add ZK Circuit Files

Copy the following files to the `zk/` directory:

- `Progressive_KYC.wasm` - Compiled circuit WebAssembly
- `Progressive_KYC_final.zkey` - Proving key (generated via Powers of Tau ceremony)
- `verification_key.json` - Verification key

Also ensure `generate_witness.js` is available (from circom build output):

```bash
cp path/to/generate_witness.js .
```

## Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

The server will run on `http://localhost:3000`

## API Endpoints

### 1. POST `/kyc/submit` - Issue KYC Credential

**Request Body:**

```json
{
  "ageNatOK": 1,
  "govtIdOK": 1,
  "faceOK": 1,
  "livenessOK": 1
}
```

**Response:**

```json
{
  "proof": {
    "pi_a": [...],
    "pi_b": [[...], [...]],
    "pi_c": [...],
    "protocol": "groth16",
    "curve": "bn128"
  },
  "publicSignals": [...],
  "credentialHash": "12345..."
}
```

### 2. POST `/bank/verify-proof` - Verify Proof

**Request Body:**

```json
{
  "proof": { ... },
  "publicSignals": [...]
}
```

**Response:**

```json
{
  "valid": true,
  "govtIdOK": true,
  "faceOK": true
}
```

## Dependencies

- **express** - Web framework
- **cors** - CORS middleware
- **dotenv** - Environment variable management
- **snarkjs** - ZK proof generation and verification
- **circomlibjs** - Poseidon hash and EdDSA signing
- **ffjavascript** - Big number arithmetic

## Workflow

1. **User submits KYC verification results** → POST `/kyc/submit`
2. **Server hashes flags** using Poseidon → `hashCredential(flags, salt)`
3. **Server signs hash** using EdDSA → `signCredentialHash(hash, issuerPrivateKey)`
4. **Server generates proof** using Groth16 → `generateProof(input)`
5. **Proof and signals returned** to user
6. **Bank verifies proof** → POST `/bank/verify-proof`
7. **Bank checks specific flags** → Extract `govtIdOK`, `faceOK` from proof

## Notes

- This is a single-threaded demo server; proof generation runs synchronously in API calls
- For production, consider offloading proof generation to background workers
- The issuer private key must be kept secure in production
- ZK circuit files must be pre-generated using circom and Powers of Tau
