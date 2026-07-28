import { SQLiteDatabase } from "expo-sqlite";
import { getDatabase } from "../connection";

/**
 * BaseRepository centralizes DB access so feature repositories
 * only need to describe *what* SQL to run, not how to obtain a
 * connection. Keeps all data access behind a consistent interface
 * (Repository Pattern) so screens/hooks never touch SQL directly.
 */
export abstract class BaseRepository {
  protected async db(): Promise<SQLiteDatabase> {
    return getDatabase();
  }

  protected nowISO(): string {
    return new Date().toISOString();
  }

  protected generateId(): string {
    // RFC4122-ish v4 UUID, sufficient for local-first client-generated keys
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
