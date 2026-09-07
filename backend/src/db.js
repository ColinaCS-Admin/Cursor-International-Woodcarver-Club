import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../../.env", import.meta.url) });
dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://iwc:iwc_dev_password@localhost:5432/woodcarver";

export const pool = new Pool({
  connectionString,
  max: 20,
});

export async function query(text, params) {
  return pool.query(text, params);
}
