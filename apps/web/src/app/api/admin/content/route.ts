import { getAdminUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { getAllConfig, setConfig } from "@core/config";


import { contentService } from "@/lib/content";

export async function GET(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDbReady();
    const config = await getAllConfig(dbClient);
    
    // Fetch CMS content
    const rules = await contentService.getPublishedContent("rules") || [];
    const lessons = await contentService.getPublishedContent("lessons") || [];
    const terms = await contentService.getPublishedContent("terms") || [];
    const openings = await contentService.getPublishedContent("openings") || {};
    const site_settings = await contentService.getPublishedContent("site-settings") || {};

    return NextResponse.json({ ...config, rules, lessons, terms, openings, site_settings });
  } catch (error) {
    console.error("Admin content fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminId = getAdminUserId(req);
    if (!adminId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureDbReady();
    const body = await req.json();

    const cmsKeys = ["rules", "lessons", "terms", "openings", "site_settings"];

    for (const [key, value] of Object.entries(body)) {
      if (cmsKeys.includes(key)) {
        const slug = key === "site_settings" ? "site-settings" : key;
        await contentService.publishContent(slug, key, value, adminId, "Admin Update");
      } else {
        await setConfig(dbClient, key, value, adminId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin content save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

