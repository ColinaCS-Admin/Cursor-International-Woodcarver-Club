import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import authRoutes from "./routes/auth.js";
import memberRoutes from "./routes/members.js";
import lookupRoutes from "./routes/lookups.js";
import { applySchema, seedIfNeeded } from "./seed.js";

dotenv.config({ path: new URL("../../.env", import.meta.url) });
dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "iwc-api" });
  } catch {
    res.status(503).json({ status: "degraded", service: "iwc-api" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use("/api", lookupRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

async function start() {
  await applySchema();
  const result = await seedIfNeeded();
  if (result.seeded) {
    console.log("First-run seed completed.");
  }
  app.listen(port, () => {
    console.log(`IWC API listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start API", err);
  process.exit(1);
});
