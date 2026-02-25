import axios from "axios";

// ZK Proof API Service
const ZK_API = axios.create({
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

export interface ProofResponse {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
  credentialHash: string;
}

export interface VerificationResult {
  valid: boolean;
  govtIdOK: boolean;
  faceOK: boolean;
}

// Submit KYC data and generate proof
export const submitKYC = async (flags: KYCFlags): Promise<ProofResponse> => {
  try {
    const response = await ZK_API.post<ProofResponse>("/kyc/submit", flags);
    return response.data;
  } catch (error) {
    console.error("Error submitting KYC:", error);
    throw error;
  }
};

// Verify proof with bank
export const verifyProofWithBank = async (
  proof: ProofResponse["proof"],
  publicSignals: ProofResponse["publicSignals"]
): Promise<VerificationResult> => {
  try {
    const response = await ZK_API.post<VerificationResult>("/bank/verify-proof", {
      proof,
      publicSignals,
    });
    return response.data;
  } catch (error) {
    console.error("Error verifying proof:", error);
    throw error;
  }
};
