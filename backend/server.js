const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 4000;

const connectionOptions = {};
if (process.env.DATABASE_URL) {
  connectionOptions.connectionString = process.env.DATABASE_URL;
} else if (
  process.env.PGHOST &&
  process.env.PGUSER &&
  process.env.PGPASSWORD &&
  process.env.PGDATABASE
) {
  connectionOptions.host = process.env.PGHOST;
  connectionOptions.port = process.env.PGPORT
    ? Number(process.env.PGPORT)
    : undefined;
  connectionOptions.user = process.env.PGUSER;
  connectionOptions.password = process.env.PGPASSWORD;
  connectionOptions.database = process.env.PGDATABASE;
} else {
  console.error(
    "Postgres configuration missing. Set DATABASE_URL or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE."
  );
  process.exit(1);
}
if (process.env.PGSSL === "true") {
  connectionOptions.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(connectionOptions);

app.use(cors());
app.use(express.json());

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS warriors (
      id SERIAL PRIMARY KEY,
      address TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
}

ensureTable().catch((err) => {
  console.error("Failed to initialize database", err);
  process.exit(1);
});

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (err) {
    console.error("Health check failed", err);
    res.status(500).json({ status: "error" });
  }
});

app.post("/warriors", async (req, res) => {
  try {
    const address = (req.body?.address || "").trim();
    if (!address) {
      return res.status(400).json({ error: "Wallet address is required." });
    }

    const normalized = address.toLowerCase();
    const insertResult = await pool.query(
      `
      INSERT INTO warriors (address)
      VALUES ($1)
      ON CONFLICT (address) DO UPDATE SET address = EXCLUDED.address
      RETURNING id, address;
    `,
      [normalized]
    );

    const warriorId = insertResult.rows[0].id;
    const positionResult = await pool.query(
      "SELECT COUNT(*) AS count FROM warriors WHERE id <= $1",
      [warriorId]
    );

    const warriorNumber = parseInt(positionResult.rows[0].count, 10);

    return res.json({
      address,
      warriorNumber,
    });
  } catch (err) {
    console.error("Failed to process /warriors", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`exc.fun backend running on port ${PORT}`);
});

