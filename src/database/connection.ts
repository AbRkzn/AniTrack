import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "anitrack.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Returns a singleton SQLite database connection.
 * Uses the new async expo-sqlite API (SDK 51+).
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // Recommended pragmas for a mobile offline-first workload
  await dbInstance.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  return dbInstance;
}

/**
 * Closes the database connection. Mainly useful for tests
 * or when performing a full restore-from-backup operation.
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}

/**
 * Deletes and recreates the underlying database file.
 * Used by the Restore Backup flow before importing a backup file.
 */
export async function resetDatabaseConnection(): Promise<void> {
  await closeDatabase();
  dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
}
