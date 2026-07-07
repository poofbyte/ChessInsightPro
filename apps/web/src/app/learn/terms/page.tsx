import { ensureDbReady } from "@/lib/db";
import { contentService } from "@/lib/content";
import { ClientTerms } from "./ClientTerms";
import { Term } from "@core/content";

export default async function ChessTermsPage() {
  await ensureDbReady();
  const terms = await contentService.getPublishedContent<Term[]>("terms") || [];

  return <ClientTerms terms={terms} />;
}
