import express from "express";
import * as snarkjs from "snarkjs";
import fs from "fs";
import path from "path";

const vkPath = path.join(process.cwd(), "zk/verification_key.json");
const vk = JSON.parse(fs.readFileSync(vkPath));
const router = express.Router();

router.post("/verify-proof", async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;
    const valid = await snarkjs.groth16.verify(vk, publicSignals, proof);

    const statusBits = BigInt(publicSignals[0]);
    const govtIdOK = (statusBits & 2n) !== 0n;
    const faceOK = (statusBits & 4n) !== 0n;

    res.json({ valid, govtIdOK, faceOK });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
});

export default router;