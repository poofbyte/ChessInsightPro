import { ensureDbReady } from "@/lib/db";
import { contentService } from "@/lib/content";
import { ClientRules } from "./ClientRules";
import { Rule } from "@core/content";

export default async function RulesPage() {
  await ensureDbReady();
  const rules = await contentService.getPublishedContent<Rule[]>("rules") || [];

  return <ClientRules rules={rules} />;
}
