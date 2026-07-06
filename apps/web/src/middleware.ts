import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// NOTE: Auth verification for /api/admin/* routes is handled inside each
// route handler (Node.js runtime) NOT here. Next.js middleware runs in the
// Edge Runtime which does NOT support Node.js crypto / jsonwebtoken.
// Doing JWT verification here would silently fail and return 401 for every request.

export function middleware(req: NextRequest) {
  return NextResponse.next();
}

// Only run middleware where truly needed (e.g. future edge-compatible auth checks)
export const config = {
  matcher: [],
};
