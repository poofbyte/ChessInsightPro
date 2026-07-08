export interface DbClient {
  execute(stmt: any): Promise<any>;
  batch(statements: any[]): Promise<any>;
}

export interface ContentEntry {
  id: string;
  slug: string;
  content_type: string;
  status: 'draft' | 'published' | 'archived';
  published_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentRevision {
  id: string;
  entry_id: string;
  data: string;
  change_summary: string | null;
  author_id: string | null;
  created_at: string;
}

export class ContentRepository {
  constructor(private db: DbClient) {}

  async getEntryBySlug(slug: string): Promise<ContentEntry | null> {
    const res = await this.db.execute({
      sql: `SELECT * FROM content_entries WHERE slug = ?`,
      args: [slug],
    });
    return res.rows.length > 0 ? (res.rows[0] as any as ContentEntry) : null;
  }

  async getPublishedRevision(entryId: string): Promise<ContentRevision | null> {
    const res = await this.db.execute({
      sql: `
        SELECT r.* FROM content_revisions r
        JOIN content_entries e ON e.published_version_id = r.id
        WHERE e.id = ?
      `,
      args: [entryId],
    });
    return res.rows.length > 0 ? (res.rows[0] as any as ContentRevision) : null;
  }

  async createEntry(entry: ContentEntry): Promise<void> {
    await this.db.execute({
      sql: `INSERT INTO content_entries (id, slug, content_type, status, published_version_id) 
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(slug) DO NOTHING`,
      args: [entry.id, entry.slug, entry.content_type, entry.status, entry.published_version_id],
    });
  }

  async updateEntry(entryId: string, status: string, publishedVersionId: string | null): Promise<void> {
    await this.db.execute({
      sql: `UPDATE content_entries SET status = ?, published_version_id = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [status, publishedVersionId, entryId],
    });
  }

  async createRevision(revision: ContentRevision): Promise<void> {
    await this.db.execute({
      sql: `INSERT INTO content_revisions (id, entry_id, data, change_summary, author_id) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [revision.id, revision.entry_id, revision.data, revision.change_summary, revision.author_id],
    });
  }

  async batch(statements: { sql: string; args: any[] }[]): Promise<any> {
    return this.db.batch(statements);
  }
}
