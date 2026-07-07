import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Client } from "@libsql/client";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function generateTokens(userId: string, role: string, accessSecret: string, refreshSecret: string) {
  const accessToken = jwt.sign({ userId, role }, accessSecret, { expiresIn: "7d" });
  const refreshToken = jwt.sign({ userId, role }, refreshSecret, { expiresIn: "30d" });
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string, accessSecret: string): { userId: string; role: string } | null {
  try {
    return jwt.verify(token, accessSecret) as { userId: string; role: string };
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

/**
 * Checks if the login attempt should be rate limited based on IP or Email.
 * Implements progressive backoff: e.g. 5 attempts / 5 mins, 10 attempts / 1 hour.
 */
export async function checkLoginRateLimit(
  client: Client, 
  ip: string, 
  email: string,
  limits = { maxIpPer5Min: 15, maxEmailPer5Min: 5, maxEmailPerHour: 15 }
): Promise<{ allowed: boolean; reason?: string }> {
  // Purge older than 24h to keep table clean
  await client.execute(`DELETE FROM login_attempts WHERE created_at < datetime('now', '-1 day')`);

  // 1. IP-based limit (5 min window)
  const ipRes = await client.execute({
    sql: `SELECT count(*) as count FROM login_attempts WHERE ip = ? AND created_at > datetime('now', '-5 minutes') AND success = 0`,
    args: [ip]
  });
  if ((ipRes.rows[0].count as number) >= limits.maxIpPer5Min) {
    return { allowed: false, reason: "Too many attempts from this IP. Please try again later." };
  }

  // 2. Email-based limit (5 min window)
  const email5mRes = await client.execute({
    sql: `SELECT count(*) as count FROM login_attempts WHERE email = ? AND created_at > datetime('now', '-5 minutes') AND success = 0`,
    args: [email]
  });
  if ((email5mRes.rows[0].count as number) >= limits.maxEmailPer5Min) {
    return { allowed: false, reason: "Too many attempts for this account. Please wait 5 minutes." };
  }

  // 3. Email-based limit (1 hour window)
  const email1hRes = await client.execute({
    sql: `SELECT count(*) as count FROM login_attempts WHERE email = ? AND created_at > datetime('now', '-1 hour') AND success = 0`,
    args: [email]
  });
  if ((email1hRes.rows[0].count as number) >= limits.maxEmailPerHour) {
    return { allowed: false, reason: "Account locked due to too many failed attempts. Please try again in 1 hour." };
  }

  return { allowed: true };
}

export async function recordLoginAttempt(client: Client, ip: string, email: string, success: boolean) {
  await client.execute({
    sql: `INSERT INTO login_attempts (id, ip, email, success) VALUES (?, ?, ?, ?)`,
    args: [crypto.randomUUID(), ip, email, success ? 1 : 0]
  });
}

