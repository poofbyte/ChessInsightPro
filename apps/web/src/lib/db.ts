import { createClient } from "@libsql/client";
import { ensureSchema } from "@core/db-sync";
import { ALL_TABLES } from "./schema";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("TURSO_DATABASE_URL is not set.");
  throw new Error("TURSO_DATABASE_URL environment variable is required");
}

export const dbClient = createClient({
  url,
  authToken,
});

let schemaSyncPromise: Promise<void> | null = null;

import { hashPassword } from "@core/auth";
import crypto from "crypto";
import { ContentService, seedContent } from "@core/content";

export async function ensureDbReady() {
  if (process.env.NODE_ENV === "test") return; // skip in tests or handle appropriately
  if (!schemaSyncPromise) {
    schemaSyncPromise = ensureSchema(dbClient, ALL_TABLES)
      .then(async () => {
        console.log("Schema sync complete");

        // Admin Bootstrap
        const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
        const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
        if (adminEmail && adminPassword) {
          const adminCheck = await dbClient.execute(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`);
          if (adminCheck.rows.length === 0) {
            const hashed = await hashPassword(adminPassword);
            await dbClient.execute({
              sql: `INSERT INTO users (id, email, password_hash, plan, role) VALUES (?, ?, ?, ?, ?)`,
              args: [crypto.randomUUID(), adminEmail, hashed, "FREE", "ADMIN"]
            });
          }
        }

        // Auto-seed CMS content (merge — keeps existing, adds missing)
        try {
          const contentService = new ContentService(dbClient);
          await seedContent(contentService);
          console.log("CMS content seeding complete.");
        } catch (e) {
          console.error("CMS content seeding failed:", e);
        }
      })
      .catch((e) => {
        console.error("Schema sync failed:", e);
        schemaSyncPromise = null;
      });
  }
  return schemaSyncPromise;
}
