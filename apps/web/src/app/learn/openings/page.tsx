import { ensureDbReady } from "@/lib/db";
import { contentService } from "@/lib/content";
import { ClientOpenings } from "./ClientOpenings";
import { Opening } from "@core/content";

export default async function OpeningsPage() {
  await ensureDbReady();
  let openings: Opening[] = [];
  try {
    const data = await contentService.getPublishedContent<Opening[]>("openings");
    if (Array.isArray(data)) {
      openings = data;
    }
  } catch (err) {
    console.error("Failed to load openings from CMS:", err);
  }
  return <ClientOpenings openings={openings} />;
}
