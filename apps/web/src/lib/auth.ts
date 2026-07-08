import { NextResponse } from "next/server";
import { verifyAccessToken, getAccessSecret } from "@core/auth";

export function requireAuth(req: Request): { userId: string } | NextResponse {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const token = authHeader.split(" ")[1];
  const decoded = verifyAccessToken(token, getAccessSecret());
  if (!decoded) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
  
  return decoded;
}

export function getAdminUserId(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const decoded = verifyAccessToken(token, getAccessSecret());
  if (!decoded || decoded.role !== "ADMIN") return null;
  return decoded.userId;
}
