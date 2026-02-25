# Frontend Integration - ZK KYC System

This document describes the frontend components and API integration for the ZK KYC proof generation and verification system.

## 📁 Project Structure

```
kyc_frontend/src/
├── apis/
│   ├── index.ts                 # Existing API services
│   └── zkpService.ts           # ✨ NEW: ZK proof API service
├── components/
│   ├── KYCSubmissionForm.tsx   # ✨ NEW: Main KYC form component
│   ├── CredentialDisplay.tsx   # ✨ NEW: Display credential details
│   ├── BankVerification.tsx    # ✨ NEW: Bank verification component
│   ├── Navigation.tsx           # UPDATED: Added ZK Proof link
│   └── ui/                      # Existing UI components
├── utils/
│   └── proofUtils.ts           # ✨ NEW: Proof utilities (download, decode)
├── pages/
│   ├── ZKProof.tsx             # ✨ NEW: ZK Proof page
│   └── ...
└── App.tsx                      # UPDATED: Added /zkproof route
```

## 🎯 New Components Created

### 1. **zkpService.ts** - API Service Layer
File: [apis/zkpService.ts](../src/apis/zkpService.ts)

Provides TypeScript interfaces and API functions for:
- `submitKYC(flags)` - Submit KYC flags and generate proof
- `verifyProofWithBank(proof, publicSignals)` - Verify proof with bank

```typescript
// Example usage
const proofData = await submitKYC({
  ageNatOK: 1,
  govtIdOK: 1,
  faceOK: 1,
  livenessOK: 0
});
```

### 2. **KYCSubmissionForm.tsx** - Main Form Component
File: [components/KYCSubmissionForm.tsx](../src/components/KYCSubmissionForm.tsx)

Features:
- Four checkboxes for KYC verification flags
- "Generate ZK Proof" button
- Error handling and loading states
- Integrates `CredentialDisplay` and `BankVerification`

### 3. **CredentialDisplay.tsx** - Results Display
File: [components/CredentialDisplay.tsx](../src/components/CredentialDisplay.tsx)

Displays:
- ✅ Credential hash (expandable/copyable)
- 📊 KYC level
- ✓ Verification flags decoded from statusBits
- 📥 Download buttons for proof.json and public.json

### 4. **BankVerification.tsx** - Verification Component
File: [components/BankVerification.tsx](../src/components/BankVerification.tsx)

Features:
- "Verify with Bank" button
- Shows verification result (✅ valid or ❌ rejected)
- Displays govtIdOK and faceOK from bank response
- Error handling and retry logic

### 5. **proofUtils.ts** - Utility Functions
File: [utils/proofUtils.ts](../src/utils/proofUtils.ts)

Functions:
- `decodeFlagsFromStatusBits(publicSignals)` - Decode flags from public signals
- `downloadProof(proof)` - Download proof.json
- `downloadPublicSignals(publicSignals)` - Download public.json
- `formatCredentialHash(hash)` - Format long hash for display

### 6. **ZKProof.tsx** - Page Component
File: [pages/ZKProof.tsx](../src/pages/ZKProof.tsx)

Page that includes:
- Header and description
- "How It Works" info card
- `KYCSubmissionForm` component
- Benefits section

## 🔄 User Flow

```
User navigates to /zkproof
        ↓
[KYCSubmissionForm]
  - Select verification flags
  - Click "Generate ZK Proof"
        ↓
[API Call] POST /kyc/submit
  - Backend: Hash flags with Poseidon
  - Backend: Sign with EdDSA
  - Backend: Generate Groth16 proof
  - Return: proof + publicSignals + credentialHash
        ↓
[CredentialDisplay]
  - Show credential hash
  - Show flags decoded from statusBits
  - Show KYC level
  - Download proof/public.json buttons
        ↓
[BankVerification]
  - Click "Verify with Bank"
  - API Call: POST /bank/verify-proof
  - Backend: Verify proof with verification key
  - Show result: valid/invalid + flags
```

## 🚀 Integration Steps

### 1. Install Dependencies (if not already done)
```bash
cd kyc_frontend
npm install axios sonner @radix-ui/react-checkbox
```

### 2. Ensure Backend is Running
```bash
cd ../server
npm start
# Should output: Server running on port 3000
```

### 3. Update Environment Variables
Verify `vite.config.ts` or `.env` is configured correctly. The frontend uses `http://localhost:3000` for ZK API calls.

### 4. Start Frontend
```bash
cd ../kyc_frontend
npm run dev
# Should output: Local: http://localhost:5173
```

### 5. Access the ZK Proof Page
Navigate to: `http://localhost:5173/zkproof`

## 📊 Data Flow

### API Request: POST /kyc/submit
```json
{
  "ageNatOK": 1,
  "govtIdOK": 1,
  "faceOK": 1,
  "livenessOK": 0
}
```

### API Response: KYC Proof
```json
{
  "proof": {
    "pi_a": ["...", "...", "1"],
    "pi_b": [["...", "..."], ["...", "..."]],
    "pi_c": ["...", "...", "1"],
    "protocol": "groth16",
    "curve": "bn128"
  },
  "publicSignals": ["15", "100", "123456789"],
  "credentialHash": "123456789abcdef..."
}
```

### Decoding Public Signals
```typescript
const statusBits = BigInt(publicSignals[0]); // "15" = 0b1111
const flags = {
  ageNatOK:   (statusBits & 1n) !== 0n,    // true
  govtIdOK:   (statusBits & 2n) !== 0n,    // true
  faceOK:     (statusBits & 4n) !== 0n,    // true
  livenessOK: (statusBits & 8n) !== 0n,    // true
};
```

### API Request: POST /bank/verify-proof
```json
{
  "proof": { ... },
  "publicSignals": ["15", "100", "123456789"]
}
```

### API Response: Verification Result
```json
{
  "valid": true,
  "govtIdOK": true,
  "faceOK": true
}
```

## 🎨 UI Components Used

All components use Shadcn UI components:
- `Card` - Display sections
- `Button` - Actions and navigation
- `Checkbox` - KYC flag selection
- `Alert` - Error/info messages
- Custom `toast()` from sonner for notifications

## 🔐 Security Considerations

✅ **What's Handled by Backend:**
- Proof generation with snarkjs
- Poseidon hashing
- EdDSA signing
- Proof verification

✅ **What Frontend Never Loads:**
- `.wasm` files
- `.zkey` files
- snarkjs library
- Direct proof generation

✅ **Privacy:**
- No personal data stored in frontend
- Only flags (boolean values) sent to backend
- Full proof computation happens server-side

## 📱 Responsive Design

All components use Tailwind CSS with responsive layouts:
- Mobile-first approach
- Grid layouts that stack on small screens
- Touch-friendly button sizes
- Readable typography across devices

## 🧪 Testing

To test the full flow:

1. **Start backend:**
   ```bash
   cd server && npm start
   ```

2. **Start frontend:**
   ```bash
   cd kyc_frontend && npm run dev
   ```

3. **Navigate to ZK Proof page:**
   - Click "ZK Proof" in navigation or go to `/zkproof`

4. **Test KYC submission:**
   - Select some verification flags
   - Click "Generate ZK Proof"
   - Verify credential details display correctly

5. **Test proof download:**
   - Click "Download proof.json"
   - Click "Download public.json"
   - Verify JSON files download

6. **Test bank verification:**
   - Click "Verify with Bank"
   - Verify result displays correctly

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find package 'express'" | Ensure backend `npm install` ran successfully |
| CORS errors | Verify backend is running on port 3000 |
| "Proof verification failed" | Check backend logs for errors |
| Components not loading | Clear cache: `Ctrl+Shift+R` or `Cmd+Shift+R` |
| Port 3000 already in use | Kill process: `lsof -ti:3000 \| xargs kill -9` (Mac/Linux) |

## 📚 API Documentation

See [/server/README.md](../../server/README.md) for complete backend API documentation.

## 🎯 Next Steps

1. **Integrate with existing KYC flow** - Connect ZK proofs to the main KYC dashboard
2. **Add credential storage** - Save proofs to blockchain or database
3. **Multi-proof support** - Allow users to generate multiple proofs
4. **Analytics** - Track proof generation success rates
5. **Mobile app** - Extend to React Native

---

**Last Updated:** January 31, 2026
