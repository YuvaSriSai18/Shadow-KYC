/**
 * Backend Proof Generation Service
 * 
 * This service handles all ZK proof generation by calling the backend API.
 * The frontend no longer handles any cryptographic operations.
 * 
 * All proofs are generated server-side using snarkjs and the circuit artifacts.
 */

import axios from "axios";

const BACKEND_API = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

export interface KYCFlags {
  ageNatOK: number;
  govtIdOK: number;
  faceOK: number;
  livenessOK: number;
}

export interface ProofData {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export interface BackendProofResponse {
  proof: ProofData;
  publicSignals: string[];
  credentialHash: string;
}

export interface VerificationResult {
  valid: boolean;
  govtIdOK: boolean;
  faceOK: boolean;
}

/**
 * Generate KYC proof on the backend
 * 
 * The backend will:
 * 1. Hash the flags using Poseidon
 * 2. Sign the hash with the issuer private key
 * 3. Call snarkjs.groth16.fullProve() with the circuit artifacts
 * 4. Return the proof and public signals
 * 
 * @param flags - KYC verification flags
 * @returns Proof data and credential hash
 */
export const generateKycProofOnBackend = async (
  flags: KYCFlags
): Promise<BackendProofResponse> => {
  try {
    console.log("Calling backend to generate ZK proof with flags:", flags);
    
    const response = await BACKEND_API.post<BackendProofResponse>(
      "/kyc/submit",
      flags
    );

    console.log("Backend proof generation successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Backend proof generation error:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.error ||
      "Failed to generate ZK proof on backend"
    );
  }
};

/**
 * Verify ZK proof with the bank/verifier contract
 * 
 * @param proof - Generated proof from backend
 * @param publicSignals - Public signals from proof generation
 * @returns Verification result
 */
export const verifyProofWithBank = async (
  proof: ProofData,
  publicSignals: string[]
): Promise<VerificationResult> => {
  try {
    console.log("Submitting proof to bank verifier");
    
    const response = await BACKEND_API.post<VerificationResult>(
      "/bank/verify-proof",
      {
        proof,
        publicSignals,
      }
    );

    console.log("Proof verification result:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Proof verification error:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.error || "Failed to verify proof"
    );
  }
};

export default {
  generateKycProofOnBackend,
  verifyProofWithBank,
};
