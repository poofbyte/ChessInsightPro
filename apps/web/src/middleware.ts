import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@core/auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /api/admin routes (API calls do send Authorization headers)
  if (pathname.startsWith("/api/admin")) {
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_ACCESS_SECRET || "default_access";
    const decoded = verifyAccessToken(token, secret);
    
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Note: /admin PAGE protection is handled client-side in the page component
  // because browser navigations don't send Authorization headers.

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/admin/:path*'
  ]
};
