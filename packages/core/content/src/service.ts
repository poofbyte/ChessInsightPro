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

  async publishMultiple(
    items: { slug: string; contentType: string; data: any; authorId?: string | null; changeSummary?: string | null }[]
  ): Promise<void> {
    if (items.length === 0) return;

    const statements: { sql: string; args: any[] }[] = [];

    for (const item of items) {
      let entry = await this.repo.getEntryBySlug(item.slug);

      if (!entry) {
        const entryId = crypto.randomUUID();
        statements.push({
          sql: `INSERT INTO content_entries (id, slug, content_type, status, published_version_id) 
                VALUES (?, ?, ?, ?, ?) ON CONFLICT(slug) DO NOTHING`,
          args: [entryId, item.slug, item.contentType, "published", null],
        });
        entry = {
          id: entryId,
          slug: item.slug,
          content_type: item.contentType,
          status: "published",
          published_version_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      const revisionId = crypto.randomUUID();
      statements.push({
        sql: `INSERT INTO content_revisions (id, entry_id, data, change_summary, author_id) 
              VALUES (?, ?, ?, ?, ?)`,
        args: [revisionId, entry.id, JSON.stringify(item.data), item.changeSummary ?? null, item.authorId ?? null],
      });
      statements.push({
        sql: `UPDATE content_entries SET status = ?, published_version_id = ?, updated_at = datetime('now') WHERE id = ?`,
        args: ["published", revisionId, entry.id],
      });
    }

    await this.repo.batch(statements);
  }
}
