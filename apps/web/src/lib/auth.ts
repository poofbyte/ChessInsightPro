import { NextResponse } from "next/server";
import { verifyAccessToken } from "@core/auth";

export function requireAuth(req: Request): { userId: string } | NextResponse {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const token = authHeader.split(" ")[1];
  const accessSecret = process.env.JWT_ACCESS_SECRET || "default_access";
  
  const decoded = verifyAccessToken(token, accessSecret);
  if (!decoded) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
  
  return decoded;
}
