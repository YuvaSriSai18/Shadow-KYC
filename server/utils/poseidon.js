import { buildPoseidon } from "circomlibjs";
import { initEddsa } from "./issuer.js";

let poseidon, F;

export async function initPoseidon() {
  poseidon = await buildPoseidon();
  F = poseidon.F;
  await initEddsa();
}

export function getField() {
  return F;
}

export function hashCredential(flags, salt) {
  if (!poseidon) throw new Error("Poseidon not initialized");

  const h = poseidon([
    flags.ageNatOK,
    flags.govtIdOK,
    flags.faceOK,
    flags.livenessOK,
    BigInt(salt)
  ]);

  return F.toString(h);
}