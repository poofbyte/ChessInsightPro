import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";

dotenv.config({ path: path.resolve(process.cwd(), "apps/web/.env.local") });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const users = await db.execute("SELECT id, email, role FROM users");
  console.log("Current Users:");
  console.table(users.rows);

  const adminEmail = "admin@chessinsight.pro";
  const existing = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [adminEmail] });
  
  if (existing.rows.length === 0) {
    const id = crypto.randomUUID();
    const passwordHash = crypto.createHash("sha256").update("AdminPassword123!").digest("hex");
    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      args: [id, adminEmail, passwordHash, "ADMIN"]
    });
    console.log(`Created admin user: ${adminEmail} / AdminPassword123!`);
  } else {
    console.log(`Admin user ${adminEmail} already exists.`);
    // Ensure they have the ADMIN role
    await db.execute({
      sql: `UPDATE users SET role = 'ADMIN' WHERE email = ?`,
      args: [adminEmail]
    });
    console.log(`Ensured role is ADMIN for ${adminEmail}.`);
  }
}

main().catch(console.error);
