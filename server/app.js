import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import kycRoutes from "./routes/kyc.js";
import bankRoutes from "./routes/bank.js";
import { initPoseidon } from "./utils/poseidon.js";

dotenv.config();

async function startServer() {
  await initPoseidon(); // ensures Poseidon + EdDSA ready

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/kyc", kycRoutes);
  app.use("/bank", bankRoutes);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log("Server running on port", PORT));
}

startServer();