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
    
    // Check if table exists
    const tableExists = await client.execute(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${table.name}'`
    );

    if (tableExists.rows.length === 0) {
      await client.execute(`CREATE TABLE ${table.name} (${colDefs})`);
      continue;
    }

    const tableInfo = await client.execute(`PRAGMA table_info(${table.name})`);
    const existingColumns = new Set(tableInfo.rows.map(r => r.name as string));
    const missingColumns = table.columns.filter(c => !existingColumns.has(c.name));

    if (missingColumns.length > 0) {
      console.log(`Table ${table.name} is missing columns: ${missingColumns.map(c => c.name).join(', ')}. Performing safe migration...`);
      
      const backupName = `${table.name}_backup_${Date.now()}`;
      const commonColumns = table.columns
        .map(c => c.name)
        .filter(name => existingColumns.has(name))
        .join(", ");

      // 1. Rename existing table
      await client.execute(`ALTER TABLE ${table.name} RENAME TO ${backupName}`);
      
      // 2. Create new table with updated schema
      await client.execute(`CREATE TABLE ${table.name} (${colDefs})`);
      
      // 3. Copy existing data if there are common columns
      if (commonColumns.length > 0) {
        await client.execute(`INSERT INTO ${table.name} (${commonColumns}) SELECT ${commonColumns} FROM ${backupName}`);
      }
      
      // We keep the backup table around just in case, but typically you'd drop it.
      // await client.execute(`DROP TABLE ${backupName}`);
      console.log(`Migration for ${table.name} complete. Old data preserved in ${backupName}`);
    }
  }
}
