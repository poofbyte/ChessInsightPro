import { getAdminUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { dbClient, ensureDbReady } from "@/lib/db";
import { getAllConfig, setConfig, setConfigBatch } from "@core/config";


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

    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      return NextResponse.json({ error: "Request body must be a non-empty object" }, { status: 400 });
    }

    const cmsKeys = ["rules", "lessons", "terms", "openings", "site_settings"];
    const cmsItems: { slug: string; contentType: string; data: any }[] = [];
    const configItems: { key: string; value: any; adminUserId: string }[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (cmsKeys.includes(key)) {
        cmsItems.push({
          slug: key === "site_settings" ? "site-settings" : key,
          contentType: key,
          data: value,
        });
      } else {
        configItems.push({ key, value, adminUserId: adminId as string });
      }
    }

    // Run CMS content batch first, then config batch
    // (two separate batches since publishMultiple reads entries first)
    try {
      await contentService.publishMultiple(cmsItems.map(item => ({
        ...item,
        authorId: adminId as string,
        changeSummary: "Admin Update",
      })));
    } catch (err) {
      console.error("CMS content batch save failed:", err);
      return NextResponse.json({ error: `CMS content save failed: ${err instanceof Error ? err.message : "Unknown error"}` }, { status: 500 });
    }

    try {
      await setConfigBatch(dbClient, configItems);
    } catch (err) {
      console.error("Config batch save failed:", err);
      return NextResponse.json({ error: `Config save failed: ${err instanceof Error ? err.message : "Unknown error"}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin content save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

