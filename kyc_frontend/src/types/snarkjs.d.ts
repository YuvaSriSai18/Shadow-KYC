declare module 'snarkjs' {
  export interface Proof {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  }

  export interface VerificationKey {
    protocol: string;
    curve: string;
    nPublic: number;
    vk_alpha_1: string[];
    vk_beta_2: string[][];
    vk_gamma_2: string[][];
    vk_delta_2: string[][];
    vk_alphabeta_12: string[][][];
    IC: string[][];
  }

  export interface ProofResult {
    proof: Proof;
    publicSignals: string[];
  }

  export namespace groth16 {
    function fullProve(
      input: Record<string, string | number>,
      wasmPath: string,
      zkeyPath: string
    ): Promise<ProofResult>;

    function verify(
      vk: VerificationKey,
      publicSignals: string[],
      proof: Proof
    ): Promise<boolean>;

    function exportSolidityCallData(
      proof: Proof,
      publicSignals: string[]
    ): Promise<string>;
  }

  // Default export
  const snarkjs: {
    groth16: typeof groth16;
  };

  export default snarkjs;
}