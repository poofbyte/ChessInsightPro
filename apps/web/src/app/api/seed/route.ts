import { NextResponse } from 'next/server';
import { runContentSeeder } from '@/lib/content';
import { ensureDbReady } from '@/lib/db';
export async function GET() {
  try {
    await ensureDbReady();
    await runContentSeeder();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}