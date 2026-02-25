import { buildEddsa } from "circomlibjs";
import { getField } from "./poseidon.js";

let eddsa;

export async function initEddsa() {
  eddsa = await buildEddsa();
}

export function signCredentialHash(hash, privateKeyHex) {
  if (!eddsa) throw new Error("Eddsa not initialized.");
  if (!privateKeyHex) throw new Error("ISSUER_PRIVATE_KEY missing in environment");

  const prv = Buffer.from(privateKeyHex, "hex");

  if (prv.length !== 32) {
    throw new Error(`Private key must be 32 bytes, got ${prv.length}`);
  }

  // Convert hash string back to field element for signPoseidon
  const F = getField();
  const hashNum = F.e(hash);
  
  const sig = eddsa.signPoseidon(prv, hashNum);

  return {
    sigR8x: eddsa.F.toString(sig.R8[0]),
    sigR8y: eddsa.F.toString(sig.R8[1]),
    sigS: sig.S.toString(),
    pubKey: eddsa.prv2pub(prv).map(x => eddsa.F.toString(x))
  };
}