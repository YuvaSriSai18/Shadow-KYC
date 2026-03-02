# Shadow-KYC

![Shadow-KYC System Architecture](https://res.cloudinary.com/dvbsion81/image/upload/v1772446621/Gemini_Generated_Image_pw5ihepw5ihepw5i_fr3ckn.png)

## Project Overview

Shadow-KYC is a comprehensive privacy-preserving Know Your Customer (KYC) verification system that revolutionizes identity verification by combining zero-knowledge proofs, artificial intelligence, and blockchain technology. The system enables users to prove their identity credentials without revealing sensitive personal information, addressing critical privacy concerns in traditional KYC processes while maintaining regulatory compliance.

The platform integrates multiple advanced technologies including Aadhaar-based identity verification, zero-knowledge cryptography, AI-powered face recognition, and decentralized storage to create a complete privacy-first identity verification ecosystem.

## Problem Statement

Traditional KYC systems pose significant privacy risks and operational challenges:

- **Data Exposure**: Sensitive personal information is repeatedly shared and stored by multiple organizations
- **Centralized Vulnerabilities**: Central databases become attractive targets for malicious actors
- **Privacy Violations**: Users have limited control over their personal data usage and storage
- **Compliance Complexity**: Organizations struggle to balance privacy requirements with regulatory obligations
- **Verification Inefficiency**: Users must complete KYC processes repeatedly across different platforms
- **Trust Dependencies**: Heavy reliance on centralized authorities and intermediaries

## Why This Project Exists

The digital economy demands robust identity verification while respecting user privacy. Shadow-KYC addresses this need by:

**Privacy Protection**: Implementing cryptographic proofs that verify compliance without data disclosure

**User Empowerment**: Giving individuals complete control over their identity verification process

**Regulatory Innovation**: Demonstrating how privacy-preserving technologies can meet compliance requirements

**Technical Advancement**: Showcasing practical applications of zero-knowledge proofs in real-world scenarios

**Ecosystem Integration**: Providing interoperable solutions that work across multiple platforms and services

**Future-Proofing**: Building infrastructure that adapts to evolving privacy regulations and user expectations

## Key Features

### Privacy-First Architecture
- Zero-knowledge proof generation ensures sensitive data never leaves user devices
- Cryptographic commitments enable verification without data exposure
- User-controlled privacy settings with selective disclosure capabilities
- End-to-end encryption for all sensitive data transmission and storage

### Advanced Identity Verification
- Aadhaar offline XML parsing and validation for Indian government IDs
- Multi-modal biometric verification using AI-powered face recognition
- Liveness detection to prevent spoofing and fraud attempts
- Document authenticity verification with tamper detection

### Blockchain Integration
- Immutable proof storage on Ethereum Sepolia testnet
- Smart contract-based verification system with gas optimization
- Wallet-bound credential management with non-transferable tokens
- Public verifiability while maintaining private data protection

### Decentralized Storage
- DataHaven StorageHub integration for private, encrypted data storage
- User-owned storage buckets with cryptographic access controls
- Separation of sensitive data from public verification proofs
- IPFS-compatible decentralized file system integration

### Artificial Intelligence
- DeepFace AI integration for high-accuracy facial recognition
- Multi-image comparison with configurable similarity thresholds
- Real-time liveness detection and anti-spoofing measures
- Continuous learning and accuracy improvement capabilities

## High-Level Architecture Explanation

Shadow-KYC implements a sophisticated three-tier architecture that separates concerns while maintaining seamless integration:

### Presentation Layer
The frontend application serves as the primary user interface, built with modern React and TypeScript technologies. This layer handles wallet connectivity, user interactions, progress tracking, and real-time feedback. It integrates directly with Web3 wallets, manages the complete KYC workflow, and provides intuitive interfaces for both users seeking verification and organizations requiring credential validation.

### Processing Layer
The processing layer consists of two specialized backend services working in coordination. The Node.js backend focuses on zero-knowledge proof generation, cryptographic operations, and blockchain interactions. It handles witness generation, proof compilation, and smart contract communication. The Python backend specializes in document processing, particularly Aadhaar XML parsing and AI-powered biometric verification using computer vision and machine learning techniques.

### Storage Layer
The storage architecture implements a dual-layer approach separating public verifiability from private data protection. The blockchain layer stores cryptographic proofs and verification metadata on Ethereum Sepolia, ensuring immutable public records without exposing sensitive information. The decentralized storage layer uses DataHaven StorageHub for encrypted private data storage, where users maintain complete control over their identity documents and biometric data through cryptographically secured private buckets.

### Cryptographic Layer
Zero-knowledge circuits written in Circom implement the core privacy-preserving logic. These circuits define verification rules, generate cryptographic witnesses, and produce Groth16 proofs that can be publicly verified without revealing private inputs. The system uses Poseidon hashing for efficient cryptographic commitments and EdDSA signatures for credential authenticity.

## Folder Structure Explanation

### kyc_frontend Directory
**Purpose**: Modern React application serving as the primary user interface

**Contains**: Component libraries, wallet integration services, DataHaven client implementations, routing logic, state management, and UI frameworks

**Connections**: Communicates with both backend services via REST APIs, interacts with blockchain networks through Web3 providers, and manages DataHaven storage operations through specialized SDKs

### backend Directory  
**Purpose**: Node.js service specializing in cryptographic operations and blockchain integration

**Contains**: Zero-knowledge proof generation utilities, snarkjs integration, circuit witness compilation, smart contract interaction modules, and credential issuance logic

**Connections**: Processes verification requests from frontend, generates ZK proofs using circuits from zkp directory, and submits transactions to Sepolia blockchain network

### kyc_backend Directory
**Purpose**: Python FastAPI service handling document processing and biometric verification

**Contains**: Aadhaar XML parsing modules, DeepFace AI integration, multi-image face matching algorithms, document validation logic, and health monitoring endpoints

**Connections**: Receives document upload requests from frontend, processes identity documents, performs biometric verification, and returns structured verification results

### shadow_kyc Directory
**Purpose**: Smart contract infrastructure managing on-chain proof storage and verification

**Contains**: Solidity contracts for ZK proof storage, Groth16 verifier implementations, deployment scripts, and Hardhat configuration

**Connections**: Deployed on Sepolia testnet, receives proof storage requests from Node.js backend, and provides public verification endpoints for credential validation

### zkp Directory
**Purpose**: Zero-knowledge proof system implementing cryptographic verification logic

**Contains**: Circom circuit definitions, compiled constraint systems, proving and verification keys, witness generation utilities, and example proof artifacts

**Connections**: Provides cryptographic primitives to Node.js backend, defines verification rules through circuit logic, and enables proof generation and validation

## Complete Repository Setup Guide

### Prerequisites

**Required Software Versions**:
- Node.js version 18 or higher
- Python 3.12 (recommended) or Python 3.9+
- npm (comes with Node.js)
- bun package manager for frontend
- Git for repository management
- MetaMask or compatible Web3 wallet

### Development Environment Setup

#### 1. Clone Repository
```bash
git clone https://github.com/mohan-1698/Shadow-KYC.git
cd Shadow-KYC
```

#### 2. Python Backend Setup (kyc_backend)

**Automatic Setup (Recommended)**:
```bash
cd kyc_backend

# Windows
setup.bat

# Linux/Unix
chmod +x setup.sh
./setup.sh

# macOS
chmod +x setup_mac.command
./setup_mac.command
```

**Manual Setup**:
```bash
cd kyc_backend

# Create virtual environment
python3.12 -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

**Configure Environment Variables** (edit `.env`):
```bash
# Firebase Configuration (Optional for basic functionality)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_STORAGE_BUCKET=your-firebase-project-id.appspot.com

# API Configuration
DEBUG=true
SECRET_KEY=your-secret-key-change-in-production
HOST=127.0.0.1
PORT=8000

# File Processing
MAX_FILE_SIZE=50MB
CLEANUP_INTERVAL_HOURS=1
```

**Start Python Backend**:
```bash
# Development mode (in kyc_backend directory with venv activated)
python run.py

# Alternative: Direct uvicorn command
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Windows batch file
start_server.bat
```
**Service runs on**: http://127.0.0.1:8000  
**API Documentation**: http://127.0.0.1:8000/docs

#### 3. Node.js Backend Setup (backend)

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.local .env

# Configure environment variables
# Edit .env and set:
ISSUER_PRIVATE_KEY=<HEX_KEY_GENERATED_IN_CIRCUITS_TO_ISSUE_PROOF_FROM_BACKEND>
PORT=3000
```

**Start Node.js Backend**:
```bash
# Development mode
npm run dev

# Production build and start
npm run build
npm start
```
**Service runs on**: http://localhost:3000 (or PORT from .env)

#### 4. Frontend Setup (kyc_frontend)

```bash
cd kyc_frontend

# Install dependencies with bun
bun install

# Alternative with npm (if bun unavailable)
npm install
```

**Environment Variables** (create `.env` in kyc_frontend):
```bash
# Backend service URLs
VITE_BACKEND_URL=http://localhost:3000
VITE_KYC_BACKEND_URL=http://localhost:8000

# Smart contract addresses (update after deployment)
VITE_CONTRACT_ADDRESS=<deployed-contract-address>
```

**Start Frontend**:
```bash
# Development mode
bun dev

# Alternative with npm
npm run dev

# Production build
bun build
# or
npm run build

# Preview production build
bun preview
# or
npm run preview
```
**Service runs on**: http://localhost:8080

#### 5. Smart Contracts Setup (shadow_kyc)

```bash
cd shadow_kyc

# Install dependencies
npm install

# Deploy to testnet (requires private key in environment)
npm run deploy

# Build contracts
npm run build

# Compile contracts (manual)
npx hardhat compile

# Deploy to local network
npx hardhat node
# In separate terminal:
npx hardhat run scripts/deploy.js --network localhost

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

**Smart Contract Environment Variables**:
Setup wallet and RPC endpoints in `hardhat.config.js` or create `.env`:
```bash
PRIVATE_KEY=your-wallet-private-key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-api-key
```

#### 6. Zero-Knowledge Circuits Setup (zkp)

```bash
cd zkp

# Install dependencies
npm install

# Generate issuer keys
node issuerKeygen.js

# Sign credentials
node signCredential.js
```

**Circuit Compilation** (if needed):
```bash
# Install circom (if not installed)
npm install -g circom

# Compile circuit
circom circuits/kyc.circom --r1cs --wasm --sym -o build

# Generate proving keys (requires powers of tau)
snarkjs powersoftau new bn128 16 ptau/pot16_0000.ptau
snarkjs powersoftau contribute ptau/pot16_0000.ptau ptau/pot16_0001.ptau
snarkjs powersoftau prepare phase2 ptau/pot16_0001.ptau ptau/pot16_final.ptau
snarkjs groth16 setup build/kyc.r1cs ptau/pot16_final.ptau zkey/kyc_0000.zkey
snarkjs zkey contribute zkey/kyc_0000.zkey zkey/kyc_final.zkey
snarkjs zkey export verificationkey zkey/kyc_final.zkey zkey/verification_key.json
```

### Complete Development Startup Sequence

**Terminal 1 - Python Backend**:
```bash
cd kyc_backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python run.py
```

**Terminal 2 - Node.js Backend**:
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend**:
```bash
cd kyc_frontend
bun dev
```

**Optional Terminal 4 - Local Blockchain** (for local testing):
```bash
cd shadow_kyc
npx hardhat node
```

### Production Setup

#### Environment Variables for Production

**kyc_backend/.env**:
```bash
DEBUG=false
SECRET_KEY=strong-production-secret-key
HOST=0.0.0.0
PORT=8000
MAX_FILE_SIZE=50MB
```

**backend/.env**:
```bash
ISSUER_PRIVATE_KEY=<production-hex-key>
PORT=3000
NODE_ENV=production
```

**kyc_frontend/.env**:
```bash
VITE_BACKEND_URL=https://your-backend-domain.com
VITE_KYC_BACKEND_URL=https://your-kyc-backend-domain.com
VITE_CONTRACT_ADDRESS=<deployed-production-contract-address>
```

#### Production Build Commands

**Python Backend**:
```bash
# Install in production mode
pip install -r requirements.txt --no-dev

# Run with production ASGI server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Node.js Backend**:
```bash
npm ci --only=production
npm run build
npm start
```

**Frontend**:
```bash
bun install --production
bun build

# Serve static files with any web server
# Example with serve:
npx serve dist
```

### Service Ports Summary

| Service | Port | URL |
|---------|------|-----|
| Frontend | 8080 | http://localhost:8080 |
| Node.js Backend | 3000 | http://localhost:3000 |
| Python Backend | 8000 | http://localhost:8000 |
| Python API Docs | 8000 | http://localhost:8000/docs |
| Local Hardhat Node | 8545 | http://localhost:8545 |

### Troubleshooting

**Python Backend Issues**:
- Ensure Python 3.12 is installed and accessible
- Activate virtual environment before running
- Check port 8000 is not in use by other services

**Node.js Backend Issues**:
- Verify Node.js 18+ is installed
- Ensure TypeScript is compiled: `npm run build`
- Check environment variables are set correctly

**Frontend Issues**:
- Try clearing bun cache: `bun pm cache rm`
- Ensure backend services are running before starting frontend
- Check that environment variables point to correct backend URLs

**Smart Contract Issues**:
- Ensure sufficient test ETH in wallet for gas fees
- Verify network configuration in hardhat.config.js
- Check RPC endpoint is accessible

## Setup & Configuration Guide

### Prerequisites

**Development Environment**:
- Node.js version 18 or higher for JavaScript runtime environments
- Python 3.9 or later for backend document processing services  
- Git for repository management and version control
- Modern web browser with Web3 wallet extension support

**Blockchain Infrastructure**:
- MetaMask or compatible Web3 wallet for blockchain interactions
- Access to Ethereum Sepolia testnet for smart contract deployment
- Test ETH for transaction gas fees and contract interactions

**Optional Advanced Tools**:
- Circom toolkit for zero-knowledge circuit development and compilation
- Hardhat framework for smart contract development and testing
- DataHaven network access for decentralized storage operations

### Environment Requirements

**System Specifications**:
- Minimum 8GB RAM for zero-knowledge proof generation operations
- Multi-core processor support for parallel cryptographic computations
- Stable internet connection for blockchain and decentralized storage access
- Modern operating system supporting Node.js and Python environments

**Network Configuration**:
- Outbound HTTPS access for API communications and blockchain connectivity
- WebSocket support for real-time blockchain event monitoring
- Cross-origin request handling for frontend-backend integration

### Installation Steps

**Repository Setup**:
Clone the repository and navigate to the project directory. Install dependencies for each service component using appropriate package managers. Configure environment variables for blockchain connectivity and service endpoints.

**Frontend Configuration**:
Navigate to the frontend directory and install React application dependencies. Configure build tools and development servers. Set up environment variables for backend service URLs and blockchain contract addresses.

**Backend Services Setup**:
Install Node.js backend dependencies and configure TypeScript compilation. Set up Python environment and install machine learning dependencies for document processing. Configure CORS policies for cross-origin frontend integration.

**Blockchain Deployment**:
Compile smart contracts using Hardhat framework. Deploy contracts to Sepolia testnet with appropriate gas configurations. Verify deployed contracts and update frontend configuration with contract addresses.

**Zero-Knowledge Circuit Setup**:
Install Circom toolkit and compile verification circuits. Generate trusted setup parameters for proof generation. Export verification keys for smart contract integration.

### Environment Variables Explanation

**Frontend Environment Variables**:
Contract address variables specify deployed smart contract locations on blockchain networks. Backend URL configurations define API endpoints for service communication. Network configuration variables control blockchain RPC endpoints and DataHaven storage settings.

**Backend Environment Variables**: 
Private key variables enable cryptographic signing and proof generation. Port configurations specify service endpoints for inter-service communication. Database connection strings manage persistent storage requirements.

**Security Variables**:
Authentication secrets secure inter-service communication channels. Encryption keys protect sensitive data transmission and storage. API rate limiting variables control request throttling and abuse prevention.

### Configuration Instructions

**Frontend Service Configuration**:
Configure Web3 provider connections for blockchain interaction. Set up DataHaven client parameters for decentralized storage access. Configure component libraries and UI framework settings for optimal user experience.

**Processing Services Configuration**:
Configure Node.js backend for zero-knowledge proof generation with appropriate circuit parameters. Set up Python backend with AI model configurations and document processing pipelines. Configure cross-service communication protocols and error handling mechanisms.

**Blockchain Configuration**:
Deploy smart contracts with appropriate access controls and gas optimization settings. Configure event listeners for real-time blockchain monitoring. Set up verification endpoints for public credential validation.

**Storage Configuration**:
Configure DataHaven storage buckets with proper access controls and encryption settings. Set up IPFS integration for distributed file system access. Configure backup and recovery mechanisms for data persistence.

## Execution Flow

### User Onboarding and Wallet Integration
Users begin by connecting their Web3 wallet through the frontend interface. The system establishes secure communication channels with MetaMask or compatible wallet providers, enabling cryptographic signature capabilities required for subsequent operations. The wallet address becomes the primary identifier for all user-associated data and proofs.

### Document Upload and Processing
Users upload Aadhaar offline ZIP files through the secure frontend interface. The Python backend service receives the encrypted document data and performs comprehensive parsing operations on the XML structure. The system extracts relevant identity fields including personal information, government ID details, and embedded photographs while maintaining data integrity throughout the process.

### Biometric Verification Process
The extracted Aadhaar photograph undergoes AI-powered analysis using DeepFace recognition algorithms. Users provide live selfie captures through the browser interface, which are processed alongside passport or ID photographs when available. The system calculates similarity scores using advanced computer vision techniques, implementing configurable thresholds to determine verification success.

### Zero-Knowledge Proof Generation
Upon successful biometric verification, the Node.js backend initiates zero-knowledge proof generation. The system compiles verification results into circuit witnesses, ensuring sensitive data remains private while generating mathematical proofs of compliance. Groth16 proof artifacts are produced using pre-compiled circuit parameters and cryptographic keys.

### Dual Storage Implementation
Verified proof data follows a dual-path storage strategy. Cryptographic proofs and public verification metadata are stored immutably on the Sepolia blockchain through smart contract interactions. Simultaneously, sensitive identity documents and biometric data are encrypted and stored in user-controlled private buckets on the DataHaven decentralized storage network.

### Verification and Validation
Third parties can verify user credentials by querying the public blockchain records using wallet addresses. The verification process validates cryptographic proofs without accessing any sensitive personal information. The system provides real-time verification results while maintaining complete privacy of underlying identity data.

## Security Considerations

### Cryptographic Security
The system implements state-of-the-art cryptographic protocols including Groth16 zero-knowledge proofs for privacy-preserving verification. Poseidon hashing ensures efficient cryptographic commitments while maintaining security guarantees. EdDSA signatures provide authentication mechanisms for credential issuance and validation processes.

### Data Privacy Protection
Sensitive personal information never leaves user devices during the proof generation process. All biometric and identity data is processed locally in browser environments or secure backend enclaves. The system implements end-to-end encryption for all data transmission channels and storage operations.

### Blockchain Security
Smart contracts are developed using OpenZeppelin security standards and undergo comprehensive testing before deployment. The system implements access controls, reentrancy protection, and gas optimization techniques to prevent common vulnerabilities. Immutable proof storage ensures tamper-proof verification records.

### Infrastructure Security
All backend services implement comprehensive input validation, rate limiting, and CORS protection mechanisms. The system uses secure communication protocols with certificate validation for all external integrations. Error handling mechanisms prevent information disclosure through exception details.

### Privacy Compliance
The architecture ensures compliance with major privacy regulations including GDPR and CCPA by implementing privacy-by-design principles. Users maintain complete control over their personal data with granular consent mechanisms. The system supports data portability and deletion rights where technically feasible.

## Scalability & Future Improvements

### Horizontal Scaling Capabilities
The microservices architecture enables independent scaling of processing components based on demand patterns. Frontend CDN integration supports global user access with optimized performance. Backend services can be containerized and orchestrated using modern cloud infrastructure patterns.

### Performance Optimization
Zero-knowledge circuit optimization reduces proof generation time through parallel processing and optimized constraint systems. Caching mechanisms improve API response times and reduce computational overhead. Database indexing and query optimization enhance data retrieval performance.

### Blockchain Evolution
Multi-chain support enables deployment across different blockchain networks to optimize for cost and performance characteristics. Layer 2 scaling solutions can reduce transaction costs while maintaining security guarantees. Cross-chain interoperability enables credential verification across different ecosystems.

### AI Enhancement
Advanced machine learning models can improve biometric verification accuracy and reduce false positive rates. Federated learning approaches enable model improvement while maintaining user privacy. Computer vision enhancements support additional biometric modalities and document types.

### Integration Expansion
API standardization enables integration with existing enterprise KYC systems and compliance platforms. Webhook mechanisms support real-time notification and automated workflow integration. Standards compliance ensures interoperability with emerging digital identity frameworks.

## Technologies Used

### Frontend Technologies
- **React 18**: Modern component-based user interface framework with concurrent rendering capabilities
- **TypeScript**: Static type checking for improved code reliability and developer experience  
- **Vite**: High-performance build tool with hot module replacement and optimized bundling
- **Tailwind CSS**: Utility-first CSS framework for rapid responsive design development
- **shadcn/ui**: Comprehensive component library built on Radix UI primitives
- **TanStack Query**: Powerful data synchronization and state management for API interactions
- **React Hook Form**: Performance-optimized forms library with minimal re-renders
- **Framer Motion**: Production-ready motion library for advanced animations and transitions

### Blockchain Technologies
- **Ethers.js**: Complete Ethereum library for blockchain interaction and smart contract integration
- **ThirdWeb SDK**: Comprehensive Web3 development platform with wallet connectivity
- **Viem**: TypeScript-first Ethereum library with improved developer experience
- **Solidity**: Smart contract programming language with advanced security features
- **Hardhat**: Development framework for smart contract compilation, testing, and deployment
- **OpenZeppelin**: Battle-tested smart contract security standards and implementations

### Backend Technologies
- **Express.js**: Minimal and flexible Node.js web application framework
- **FastAPI**: Modern, fast web framework for building APIs with Python
- **snarkjs**: JavaScript library for zero-knowledge proof generation and verification
- **Circom**: Domain-specific language for writing arithmetic circuits
- **DeepFace**: Advanced face recognition library with multiple model options
- **OpenCV**: Computer vision library for image processing and analysis

### Cryptographic Technologies  
- **Groth16**: Efficient zero-knowledge proof system with constant proof size
- **Poseidon**: ZK-friendly hash function optimized for arithmetic circuits
- **EdDSA**: Digital signature algorithm with enhanced security properties
- **bn128**: Pairing-friendly elliptic curve for efficient cryptographic operations

### Storage and Infrastructure
- **DataHaven StorageHub**: Decentralized storage network with cryptographic access controls
- **Polkadot API**: Substrate-based blockchain interaction library
- **IPFS**: Distributed file system for decentralized content addressing
- **WebSocket**: Real-time bidirectional communication protocol for live updates

## Contribution Guidelines

### Development Standards
Contributors should follow established coding conventions with TypeScript strict mode enabled and comprehensive ESLint configuration. All submissions require thorough testing including unit tests, integration tests, and end-to-end user flow validation. Documentation updates must accompany any feature additions or architectural changes.

### Code Review Process
All contributions undergo peer review through pull request workflows with automated testing and manual code inspection. Security-sensitive changes require additional review from cryptography and blockchain specialists. Performance impact assessment is mandatory for backend service modifications.

### Issue Management
Bug reports should include detailed reproduction steps, environment specifications, and relevant log outputs. Feature requests require clear use case descriptions and implementation proposals. Security vulnerabilities should be reported through private channels following responsible disclosure protocols.

### Testing Requirements
New features require comprehensive test coverage including positive and negative test cases. Performance regression testing ensures system scalability under increased load conditions. Cross-browser compatibility testing validates frontend functionality across different environments.

## License

This project is released under the MIT License, providing maximum flexibility for both open source and commercial usage. The license permits modification, distribution, and private use while requiring attribution to original creators. Contributors retain copyright over their individual contributions while granting usage rights under the same license terms.

---

**Built with commitment to privacy, security, and user empowerment in the digital identity verification landscape.**
