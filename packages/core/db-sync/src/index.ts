import { Client } from "@libsql/client";

export interface ColumnDefinition {
  name: string;
  type: string;
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
}

export async function ensureSchema(client: Client, tables: TableDefinition[]) {
  for (const table of tables) {
    const colDefs = table.columns.map(c => `${c.name} ${c.type}`).join(", ");
    await client.execute(`CREATE TABLE IF NOT EXISTS ${table.name} (${colDefs})`);

    const tableInfo = await client.execute(`PRAGMA table_info(${table.name})`);
    const existingColumns = new Set(tableInfo.rows.map(r => r.name as string));

    for (const col of table.columns) {
      if (!existingColumns.has(col.name)) {
        console.log(`Adding column ${col.name} to table ${table.name}`);
        await client.execute(`ALTER TABLE ${table.name} ADD COLUMN ${col.name} ${col.type}`);
      }
    }
  }
}
