import { BaseRepository } from "./BaseRepository";

class SettingsRepository extends BaseRepository {
  async get(key: string): Promise<string | null> {
    const db = await this.db();
    const row = await db.getFirstAsync<{ value: string | null }>(
      "SELECT value FROM settings WHERE key = ?",
      key
    );
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      key,
      value,
      this.nowISO()
    );
  }

  async getAll(): Promise<Record<string, string | null>> {
    const db = await this.db();
    const rows = await db.getAllAsync<{ key: string; value: string | null }>(
      "SELECT key, value FROM settings"
    );
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }
}

export const settingsRepository = new SettingsRepository();
