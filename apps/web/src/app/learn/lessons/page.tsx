import { ensureDbReady } from "@/lib/db";
import { contentService } from "@/lib/content";
import { ClientLessons } from "./ClientLessons";
import { Lesson } from "@core/content";

export default async function LessonsPage() {
  await ensureDbReady();
  const lessons = await contentService.getPublishedContent<Lesson[]>("lessons") || [];

  return <ClientLessons lessons={lessons} />;
}
