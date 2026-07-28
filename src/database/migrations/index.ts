import { SQLiteDatabase } from "expo-sqlite";
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from "../schema";

/**
 * Runs all pending migrations against the given database.
 * Currently a single baseline migration; future schema changes
 * should be appended here as `migrateV1toV2`, etc., guarded by
 * the stored schema_meta.version.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(CREATE_TABLES_SQL);

  const row = await db.getFirstAsync<{ version: number }>(
    "SELECT version FROM schema_meta WHERE id = 1"
  );

  if (!row) {
    await db.runAsync(
      "INSERT INTO schema_meta (id, version) VALUES (1, ?)",
      SCHEMA_VERSION
    );
    return;
  }

  if (row.version < SCHEMA_VERSION) {
    // Future migration steps go here, e.g.:
    // if (row.version < 2) { await migrateV1toV2(db); }
    await db.runAsync(
      "UPDATE schema_meta SET version = ? WHERE id = 1",
      SCHEMA_VERSION
    );
  }
}
