import { Client } from "@libsql/client";
import crypto from "crypto";

// In-memory cache
const configCache: Record<string, any> = {};
let lastFetch = 0;
const CACHE_TTL = 1000 * 60; // 1 minute

export async function getAllConfig(db: Client) {
  if (Date.now() - lastFetch < CACHE_TTL && Object.keys(configCache).length > 0) {
    return configCache;
  }
  
  const result = await db.execute("SELECT key, value FROM system_config");
  
  // Clear cache
  for (const k in configCache) delete configCache[k];
  
  result.rows.forEach((row) => {
    const key = row.key as string;
    const value = row.value as string;
    try {
      configCache[key] = JSON.parse(value);
    } catch {
      configCache[key] = value;
    }
  });
  
  lastFetch = Date.now();
  return configCache;
}

export async function getConfig(db: Client, key: string, defaultValue: any = null) {
  const all = await getAllConfig(db);
  return all[key] !== undefined ? all[key] : defaultValue;
}

export async function setConfig(db: Client, key: string, value: any, adminUserId: string) {
  const strValue = typeof value === "object" ? JSON.stringify(value) : String(value);
  
  await db.execute({
    sql: `
      INSERT INTO system_config (key, value, updated_by) 
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value, 
        updated_by = excluded.updated_by, 
        updated_at = datetime('now')
    `,
    args: [key, strValue, adminUserId]
  });
  
  // Write audit log
  const auditId = crypto.randomUUID();
  await db.execute({
    sql: `
      INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [
      auditId, 
      adminUserId, 
      "UPDATE_CONFIG", 
      "system_config", 
      key, 
      JSON.stringify({ newValue: value })
    ]
  });
  
  // Update cache
  configCache[key] = value;
  return value;
}
