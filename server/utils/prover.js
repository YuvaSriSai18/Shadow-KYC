import * as snarkjs from "snarkjs";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export async function generateProof(input) {
  const workDir = path.join(process.cwd(), "zk");

  try {
    const inputPath = path.join(workDir, "input.json");
    const witnessPath = path.join(workDir, "witness.wtns");
    const zkeyPath = path.join(workDir, "kyc_final.zkey");
    const wasmPath = path.join(workDir, "kyc.wasm");

    console.log("Input for circuit:", JSON.stringify(input, null, 2));
    fs.writeFileSync(inputPath, JSON.stringify(input));

    console.log("Generating witness...");
    execSync(`node generate_witness.js kyc.wasm input.json witness.wtns`, { cwd: workDir });

    // Read witness buffer and zkey
    const witnessBuffer = fs.readFileSync(witnessPath);
    const zkeyBuffer = fs.readFileSync(zkeyPath);

    console.log("Witness buffer size:", witnessBuffer.length);
    console.log("Zkey buffer size:", zkeyBuffer.length);
    console.log("Starting groth16.prove()...");

    const { proof, publicSignals } = await snarkjs.groth16.prove(zkeyBuffer, witnessBuffer);

    console.log("Proof generated successfully");
    console.log("Public signals:", publicSignals);

    fs.unlinkSync(inputPath);
    fs.unlinkSync(witnessPath);

    return { proof, publicSignals };

  } catch (error) {
    console.error("Full proof generation error:", error);
    throw new Error(`Proof generation failed: ${error.message}`);
  }
}