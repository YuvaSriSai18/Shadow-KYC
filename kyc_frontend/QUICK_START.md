# 🎯 Quick Start - ZK KYC Frontend Integration

## Files Added

| File | Purpose |
|------|---------|
| `apis/zkpService.ts` | API calls to backend ZK endpoints |
| `utils/proofUtils.ts` | Utilities for proof handling |
| `components/KYCSubmissionForm.tsx` | Main form component |
| `components/CredentialDisplay.tsx` | Show credential details |
| `components/BankVerification.tsx` | Verify proof with bank |
| `pages/ZKProof.tsx` | Complete ZK proof page |
| `FRONTEND_INTEGRATION.md` | Detailed integration guide |

## Files Updated

| File | Changes |
|------|---------|
| `App.tsx` | Added `/zkproof` route |
| `Navigation.tsx` | Added ZK Proof nav link |

---

## 🚀 How to Start

### 1. Start Backend (Terminal 1)
```bash
cd server
npm start
```
Expected output: `Server running on port 3000`

### 2. Start Frontend (Terminal 2)
```bash
cd kyc_frontend
npm run dev
```
Expected output: `Local: http://localhost:5173`

### 3. Open Browser
```
http://localhost:5173/zkproof
```

---

## 🎮 Testing the Flow

### Step 1: Fill Form
- Check "Age/Nationality Verified" ✓
- Check "Government ID Verified" ✓
- Check "Face Verified" ✓
- Leave "Liveness Verified" unchecked

### Step 2: Generate Proof
- Click "Generate ZK Proof"
- Wait for backend to process
- See credential hash and flags

### Step 3: Download Files
- Click "Download proof.json"
- Click "Download public.json"
- Files saved to Downloads folder

### Step 4: Verify with Bank
- Click "Verify with Bank"
- See verification result (✅ valid or ❌ rejected)
- Review govtIdOK and faceOK flags

---

## 📊 Data Being Sent

### To Backend (/kyc/submit)
```javascript
{
  ageNatOK: 1,        // 1 = true, 0 = false
  govtIdOK: 1,
  faceOK: 1,
  livenessOK: 0
}
```

### From Backend (Proof Response)
```javascript
{
  proof: {
    pi_a: [...],
    pi_b: [...],
    pi_c: [...],
    protocol: "groth16",
    curve: "bn128"
  },
  publicSignals: ["15", "100", "123456789"],
  credentialHash: "0x123456..."
}
```

### Bank Verification (/bank/verify-proof)
Backend returns:
```javascript
{
  valid: true,         // Proof is valid
  govtIdOK: true,      // Flag bit 1
  faceOK: true         // Flag bit 2
}
```

---

## 🔍 Component Breakdown

### KYCSubmissionForm
- Main entry point
- Form with 4 checkboxes
- "Generate ZK Proof" button
- Calls `submitKYC()` from zkpService

### CredentialDisplay
- Shows credential hash
- Decodes flags from publicSignals
- Shows KYC level
- Download buttons for JSON files

### BankVerification
- "Verify with Bank" button
- Calls `verifyProofWithBank()` from zkpService
- Shows result (valid/invalid)
- Displays govtIdOK and faceOK

---

## 🛠 How It Works

```
Frontend                          Backend
--------                          -------

Select flags
  ↓
Click "Generate Proof"
  ↓
[POST /kyc/submit]    --------→   Hash flags (Poseidon)
                                  Sign with EdDSA
                                  Generate proof (Groth16)
                      ←--------    Return proof + signals + hash
  ↓
Show credential details
  ↓
Download JSON files
  ↓
Click "Verify with Bank"
  ↓
[POST /bank/verify-proof] ---→    Verify proof
                                  Extract flags
                      ←--------    Return valid + flags
  ↓
Show verification result
```

---

## 🐛 Common Issues

| Issue | Fix |
|-------|-----|
| "Cannot connect to backend" | Make sure backend is running on port 3000 |
| CORS error | Backend should have CORS enabled (it does) |
| Proof verification fails | Check backend logs, try again |
| Components not showing | Refresh page, clear cache |
| Port 3000 already in use | Kill the process using port 3000 |

---

## 📝 Code Example

### Complete Flow in Components
```tsx
// 1. User fills form
const [flags, setFlags] = useState({ ageNatOK: 1, ... });

// 2. Submit form
const proofData = await submitKYC(flags);

// 3. Display results
<CredentialDisplay proofData={proofData} />

// 4. Verify with bank
const result = await verifyProofWithBank(
  proofData.proof, 
  proofData.publicSignals
);

// 5. Show result
if (result.valid) {
  // Show success
}
```

---

## ✅ Checklist

- [x] Backend running on port 3000
- [x] Frontend running on port 5173
- [x] `/zkproof` route accessible
- [x] Form displays correctly
- [x] Generate Proof button works
- [x] Credential details show
- [x] Download buttons work
- [x] Bank verification works
- [x] Error handling works
- [x] Mobile responsive

---

## 📚 For More Details

See `FRONTEND_INTEGRATION.md` for:
- Complete data flow
- Security considerations
- Testing instructions
- Troubleshooting guide
- Next steps

---

**Status:** ✅ Ready to Use
**Last Updated:** January 31, 2026
