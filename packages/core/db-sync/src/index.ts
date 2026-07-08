import { Client } from "@libsql/client";

export interface ColumnDefinition {
  name: string;
  type: string;
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
}

function safeId(name: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid SQL identifier: ${name}`);
  }
  return name;
}

const cache = new Map<string, { existingColumns: Set<string> }>();

export async function ensureSchema(client: Client, tables: TableDefinition[]) {
  for (const table of tables) {
    const safeTable = safeId(table.name);
    const colDefs = table.columns.map(c => `${safeId(c.name)} ${c.type}`).join(", ");

    const tableExists = await client.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      args: [table.name],
    });

    if (tableExists.rows.length === 0) {
      await client.execute(`CREATE TABLE ${safeTable} (${colDefs})`);
      continue;
    }

    if (cache.has(table.name)) {
      const cached = cache.get(table.name)!;
      const missing = table.columns.filter(c => !cached.existingColumns.has(c.name));
      if (missing.length === 0) continue;
    }

    const tableInfo = await client.execute({ sql: `PRAGMA table_info(${safeTable})`, args: [] });
    const existingColumns = new Set(tableInfo.rows.map(r => r.name as string));
    cache.set(table.name, { existingColumns });

    const missingColumns = table.columns.filter(c => !existingColumns.has(c.name));

    if (missingColumns.length > 0) {
      console.log(`Table ${safeTable} is missing columns: ${missingColumns.map(c => c.name).join(', ')}. Performing safe migration...`);

      const backupName = `${safeTable}_backup_${Date.now()}`;
      const commonCols = table.columns
        .map(c => safeId(c.name))
        .filter(name => existingColumns.has(name))
        .join(", ");

      const statements: { sql: string; args: any[] }[] = [
        { sql: `ALTER TABLE ${safeTable} RENAME TO ${backupName}`, args: [] },
        { sql: `CREATE TABLE ${safeTable} (${colDefs})`, args: [] },
      ];

      if (commonCols.length > 0) {
        statements.push({ sql: `INSERT INTO ${safeTable} (${commonCols}) SELECT ${commonCols} FROM ${backupName}`, args: [] });
      }

      await client.batch(statements);

      console.log(`Migration for ${safeTable} complete. Old data preserved in ${backupName}`);
    }
  }
}
