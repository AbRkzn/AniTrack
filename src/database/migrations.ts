import { getDatabase, queryFirst, executeSql } from './index';

export interface Migration {
  version: number;
  name: string;
  up: (db: any) => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: async () => {
      // Schema is created in initializeDatabase
    },
  },
];

export async function runMigrations(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const result = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM settings WHERE key = ?',
    ['schema_version']
  );

  let currentVersion = result ? result.version : 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await migration.up(db);
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        ['schema_version', String(migration.version)]
      );
      currentVersion = migration.version;
    }
  }
}

export async function getSchemaVersion(): Promise<number> {
  const result = await queryFirst<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    ['schema_version']
  );
  return result ? parseInt(result.value, 10) : 0;
}
