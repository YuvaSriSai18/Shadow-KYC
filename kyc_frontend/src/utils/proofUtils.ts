// Decode status bits from public signals
export function decodeFlagsFromStatusBits(publicSignals: string[]): {
  ageNatOK: boolean;
  govtIdOK: boolean;
  faceOK: boolean;
  livenessOK: boolean;
} {
  const statusBits = BigInt(publicSignals[0]);

  return {
    ageNatOK: (statusBits & 1n) !== 0n,
    govtIdOK: (statusBits & 2n) !== 0n,
    faceOK: (statusBits & 4n) !== 0n,
    livenessOK: (statusBits & 8n) !== 0n,
  };
}

// Download proof as JSON
export function downloadProof(proof: any): void {
  const blob = new Blob([JSON.stringify(proof, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "proof.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Download public signals as JSON
export function downloadPublicSignals(publicSignals: string[]): void {
  const blob = new Blob([JSON.stringify(publicSignals, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "public.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Format credential hash for display
export function formatCredentialHash(hash: string): string {
  if (hash.length <= 20) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-10)}`;
}
