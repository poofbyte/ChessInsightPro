import { createClient } from "@libsql/client";
import { ensureSchema } from "@core/db-sync";
import { ALL_TABLES } from "./schema";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.warn("TURSO_DATABASE_URL is not set. Database operations will fail.");
}

export const dbClient = createClient({
  url: url || "file:local.db",
  authToken,
});

let schemaSyncPromise: Promise<void> | null = null;

export async function ensureDbReady() {
  if (process.env.NODE_ENV === "test") return; // skip in tests or handle appropriately
  if (!schemaSyncPromise) {
    schemaSyncPromise = ensureSchema(dbClient, ALL_TABLES)
      .then(() => console.log("Schema sync complete"))
      .catch((e) => {
        console.error("Schema sync failed:", e);
        schemaSyncPromise = null;
      });
  }
  return schemaSyncPromise;
}
