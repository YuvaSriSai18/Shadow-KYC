import express from "express";
import { hashCredential } from "../utils/poseidon.js";
import { signCredentialHash } from "../utils/issuer.js";
import { generateProof } from "../utils/prover.js";

const router = express.Router();

router.post("/submit", async (req, res) => {
  try {
    const { ageNatOK, govtIdOK, faceOK, livenessOK } = req.body;
    const salt = Math.floor(Math.random() * 1e6);

    const flags = {
      ageNatOK: Number(ageNatOK),
      govtIdOK: Number(govtIdOK),
      faceOK: Number(faceOK),
      livenessOK: Number(livenessOK),
    };

    const hash = hashCredential(flags, salt);
    const sig = signCredentialHash(hash, process.env.ISSUER_PRIVATE_KEY);

    const input = {
      ageNatOK: ageNatOK.toString(),
      govtIdOK: govtIdOK.toString(),
      faceOK: faceOK.toString(),
      livenessOK: livenessOK.toString(),
      salt: salt.toString(),
      sigR8x: sig.sigR8x.toString(),
      sigR8y: sig.sigR8y.toString(),
      sigS: sig.sigS.toString(),
      issuerPubKey: sig.pubKey.map(x => x.toString())
    };

    const proofData = await generateProof(input);
    res.json({ ...proofData, credentialHash: hash });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;