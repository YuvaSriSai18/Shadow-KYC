// zkKycUtils.ts
// Utilities for KYCKycProgressive circuit (Groth16, snarkjs 0.7.5)

// Using dynamic imports for snarkjs to avoid TypeScript module resolution issues

// Polyfill for Node.js globals in browser environment
if (typeof global === 'undefined') {
  (globalThis as any).global = globalThis;
}

// -----------------------------
// Types
// -----------------------------

export type KycInputs = {
  ageNatOK: number | string;
  govtIdOK: number | string;
  faceOK: number | string;
  livenessOK: number | string;
  salt: number | string;
};

export type ParsedPublicSignals = {
  statusBits: bigint;      // bitmask
  level: bigint;           // KYC level
  credentialHash: bigint;  // Poseidon commitment
};

export type SolidityCallData = {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
  input: string[]; // [statusBits, level, credentialHash]
};

export type KycProofResult = ParsedPublicSignals & {
  proof: any;
  publicSignals: string[];
};

// -----------------------------
// Default paths (override if needed)
// -----------------------------

export const DEFAULT_WASM_PATH = "/zk/Progressive_KYC.wasm";
export const DEFAULT_ZKEY_PATH = "/zk/Progressive_KYC_final.zkey";
export const DEFAULT_VK_PATH   = "/zk/verification_key.json";

// -----------------------------
// Helpers
// -----------------------------

function toFieldString(x: string | number | bigint): string {
  return BigInt(x).toString(); // snarkjs expects decimal strings
}

// publicSignals[0] -> statusBits
// publicSignals[1] -> level
// publicSignals[2] -> credentialHash
export function parsePublicSignals(publicSignals: string[]): ParsedPublicSignals {
  if (publicSignals.length < 3) {
    throw new Error(`Expected at least 3 public signals, got ${publicSignals.length}`);
  }

  return {
    statusBits: BigInt(publicSignals[0]),
    level: BigInt(publicSignals[1]),
    credentialHash: BigInt(publicSignals[2]),
  };
}

// Decode bitmask into individual flags
export function decodeStatusBits(
  bits: bigint | number | string
): {
  ageNatOK: boolean;
  govtIdOK: boolean;
  faceOK: boolean;
  livenessOK: boolean;
} {
  const b = Number(BigInt(bits) & BigInt("0xffff")); // just to be safe

  return {
    ageNatOK:   (b & 1) !== 0, // bit0
    govtIdOK:   (b & 2) !== 0, // bit1
    faceOK:     (b & 4) !== 0, // bit2
    livenessOK: (b & 8) !== 0, // bit3
  };
}

// Load verification key via fetch (browser)
export async function loadVerificationKey(
  vkPath: string = DEFAULT_VK_PATH
): Promise<any> {
  try {
    console.log('Loading verification key from:', vkPath);
    const res = await fetch(vkPath);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const vk = await res.json();
    console.log('Verification key loaded successfully');
    return vk;
  } catch (error: any) {
    console.error('Failed to load verification key:', error);
    throw new Error(`Failed to load verification key from ${vkPath}: ${error.message}`);
  }
}

// -----------------------------
// Core: Generate proof
// -----------------------------

export async function generateKycProof(
  inputs: KycInputs,
  wasmPath: string = DEFAULT_WASM_PATH,
  zkeyPath: string = DEFAULT_ZKEY_PATH
): Promise<KycProofResult> {
  try {
    console.log('Starting ZK proof generation with inputs:', inputs);
    console.log('Using paths:', { wasmPath, zkeyPath });

    // Dynamic import of snarkjs to ensure it loads properly
    const snarkjs = await import('snarkjs');
    const groth16Module = snarkjs.groth16;

    // Normalise to field strings
    const formattedInputs = {
      ageNatOK: toFieldString(inputs.ageNatOK),
      govtIdOK: toFieldString(inputs.govtIdOK),
      faceOK: toFieldString(inputs.faceOK),
      livenessOK: toFieldString(inputs.livenessOK),
      salt: toFieldString(inputs.salt),
    };

    console.log('Formatted inputs for circuit:', formattedInputs);

    // Check if files exist before attempting to generate proof
    try {
      const wasmResponse = await fetch(wasmPath);
      if (!wasmResponse.ok) {
        throw new Error(`Failed to load WASM file: ${wasmPath} (${wasmResponse.status})`);
      }
    } catch (error) {
      throw new Error(`WASM file not accessible: ${wasmPath}. Please ensure the file exists in the public folder.`);
    }

    try {
      const zkeyResponse = await fetch(zkeyPath);
      if (!zkeyResponse.ok) {
        throw new Error(`Failed to load zkey file: ${zkeyPath} (${zkeyResponse.status})`);
      }
    } catch (error) {
      throw new Error(`Zkey file not accessible: ${zkeyPath}. Please ensure the file exists in the public folder.`);
    }

    const { proof, publicSignals } = await groth16Module.fullProve(
      formattedInputs,
      wasmPath,
      zkeyPath
    );

    console.log('ZK proof generated successfully');
    console.log('Public signals:', publicSignals);

    const parsed = parsePublicSignals(publicSignals);

    return {
      proof,
      publicSignals,
      ...parsed,
    };
  } catch (error: any) {
    console.error('Error in generateKycProof:', error);
    throw new Error(`ZK proof generation failed: ${error.message || error}`);
  }
}

// -----------------------------
// Off-chain verification
// -----------------------------

// If you already have vk object
export async function verifyKycProofWithVkObject(
  vk: any,
  publicSignals: string[],
  proof: any
): Promise<boolean> {
  const snarkjs = await import('snarkjs');
  return snarkjs.groth16.verify(vk, publicSignals, proof);
}

// If you want this util to load vk for you (browser)
export async function verifyKycProof(
  publicSignals: string[],
  proof: any,
  vkPath: string = DEFAULT_VK_PATH
): Promise<boolean> {
  const vk = await loadVerificationKey(vkPath);
  return verifyKycProofWithVkObject(vk, publicSignals, proof);
}

// -----------------------------
// Solidity calldata builder
// -----------------------------

export async function buildSolidityCallData(
  proof: any,
  publicSignals: string[]
): Promise<SolidityCallData> {
  const snarkjs = await import('snarkjs');
  const raw = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);

  // raw is a big string like: "[a0,a1],[b00,b01],[b10,b11],[c0,c1],[input0,input1,input2]"
  const argv = raw
    .replace(/["[\]\s]/g, "") // remove quotes, brackets, spaces
    .split(",");

  if (argv.length < 8) {
    throw new Error(`Unexpected calldata length: ${argv.length} < 8`);
  }

  const a: [string, string] = [argv[0], argv[1]];
  const b: [[string, string], [string, string]] = [
    [argv[2], argv[3]],
    [argv[4], argv[5]],
  ];
  const c: [string, string] = [argv[6], argv[7]];
  const input: string[] = argv.slice(8);

  return { a, b, c, input };
}

// -----------------------------
// High-level convenience: full flow
// -----------------------------

/**
 * 1. Generate proof
 * 2. Verify off-chain
 * 3. Build Solidity calldata (a, b, c, input)
 */
export async function prepareKycOnchainData(
  inputs: KycInputs,
  wasmPath: string = DEFAULT_WASM_PATH,
  zkeyPath: string = DEFAULT_ZKEY_PATH,
  vkPath: string = DEFAULT_VK_PATH
): Promise<
  KycProofResult & {
    calldata: SolidityCallData;
    isValidOffchain: boolean;
  }
> {
  const proofResult = await generateKycProof(inputs, wasmPath, zkeyPath);
  const isValidOffchain = await verifyKycProof(
    proofResult.publicSignals,
    proofResult.proof,
    vkPath
  );
  const calldata = await buildSolidityCallData(
    proofResult.proof,
    proofResult.publicSignals
  );

  return {
    ...proofResult,
    calldata,
    isValidOffchain,
  };
}
