import { NextResponse } from 'next/server';
import { runContentSeeder } from '@/lib/content';
import { ensureDbReady } from '@/lib/db';
export async function GET() { await ensureDbReady(); await runContentSeeder(); return NextResponse.json({ success: true }); }