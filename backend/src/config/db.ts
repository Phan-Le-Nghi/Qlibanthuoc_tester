import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const config: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "",
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

export const pool = new sql.ConnectionPool(config);

export const poolConnect = pool.connect()
  .then(() => {
    console.log("🔥 Connected to Azure SQL");
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err);
  });

export { sql };