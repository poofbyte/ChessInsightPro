import { NextResponse } from 'next/server';
import { runContentSeeder } from '@/lib/content';
import { ensureDbReady } from '@/lib/db';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: "Seed endpoint is disabled in production" }, { status: 403 });
  }

  try {
    await ensureDbReady();
    await runContentSeeder();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
