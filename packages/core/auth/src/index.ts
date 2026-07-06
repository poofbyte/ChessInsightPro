import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Client } from "@libsql/client";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function generateTokens(userId: string, accessSecret: string, refreshSecret: string) {
  const accessToken = jwt.sign({ userId }, accessSecret, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId }, refreshSecret, { expiresIn: "30d" });
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string, accessSecret: string): { userId: string } | null {
  try {
    return jwt.verify(token, accessSecret) as { userId: string };
  } catch {
    return null;
  }
}

export async function checkSignupRateLimit(client: Client, ip: string, threshold = 3): Promise<boolean> {
  // Purge old attempts (older than 24h)
  await client.execute(`DELETE FROM signup_attempts WHERE created_at < datetime('now', '-1 day')`);
  
  // Count recent attempts
  const result = await client.execute({
    sql: `SELECT count(*) as count FROM signup_attempts WHERE ip = ?`,
    args: [ip]
  });
  const count = result.rows[0].count as number;
  return count < threshold;
}

export async function recordSignupAttempt(client: Client, ip: string) {
  await client.execute({
    sql: `INSERT INTO signup_attempts (id, ip) VALUES (?, ?)`,
    args: [crypto.randomUUID(), ip]
  });
}
