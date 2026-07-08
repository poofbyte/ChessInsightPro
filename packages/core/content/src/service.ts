import { ContentRepository, DbClient } from "./repository";
import { z } from "zod";
import crypto from "crypto";

export class ContentService {
  private repo: ContentRepository;

  constructor(db: DbClient) {
    this.repo = new ContentRepository(db);
  }

  async getPublishedContent<T>(slug: string, schema?: z.ZodSchema<T>): Promise<T | null> {
    const entry = await this.repo.getEntryBySlug(slug);
    if (!entry || entry.status !== "published" || !entry.published_version_id) return null;

    const revision = await this.repo.getPublishedRevision(entry.id);
    if (!revision) return null;

    try {
      const data = JSON.parse(revision.data);
      if (schema) {
        return schema.parse(data);
      }
      return data as T;
    } catch (err) {
      console.error(`Error parsing published content for slug ${slug}:`, err);
      return null;
    }
  }

  async publishContent(
    slug: string,
    contentType: string,
    data: any,
    authorId: string | null = null,
    changeSummary: string | null = null
  ): Promise<void> {
    let entry = await this.repo.getEntryBySlug(slug);
    
    if (!entry) {
      const entryId = crypto.randomUUID();
      entry = {
        id: entryId,
        slug,
        content_type: contentType,
        status: "published",
        published_version_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await this.repo.createEntry(entry);
    }

    const revisionId = crypto.randomUUID();
    const revision = {
      id: revisionId,
      entry_id: entry.id,
      data: JSON.stringify(data),
      change_summary: changeSummary,
      author_id: authorId,
      created_at: new Date().toISOString(),
    };

    await this.repo.createRevision(revision);
    await this.repo.updateEntry(entry.id, "published", revisionId);
  }
}
