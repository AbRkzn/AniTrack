import { queryAll, queryFirst, executeSql } from '../database';

export type SyncOperation = 'create' | 'update' | 'delete';

export type SyncTable =
  | 'crops'
  | 'harvests'
  | 'expenses'
  | 'fertilizer_schedules'
  | 'animals'
  | 'animal_health_records'
  | 'fields'
  | 'farm_tasks'
  | 'budgets';

export const SYNC_TABLES: SyncTable[] = [
  'crops',
  'harvests',
  'expenses',
  'fertilizer_schedules',
  'animals',
  'animal_health_records',
  'fields',
  'farm_tasks',
  'budgets',
];

export interface SyncQueueRow {
  id: string;
  table_name: SyncTable;
  recordId: string;
  operation: SyncOperation;
  payload: string;
  status: 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';
  retryCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

let pendingHint = 0;

export function setPendingHint(count: number): void {
  pendingHint = count;
}

export function getPendingHint(): number {
  return pendingHint;
}

export function recordSyncChange(table: SyncTable, operation: SyncOperation, recordId: string): Promise<void> {
  const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  pendingHint += 1;
  return executeSql(
    `INSERT INTO sync_queue (id, table_name, recordId, operation, payload, status, retryCount, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, '{}', 'pending', 0, ?, ?)`,
    [id, table, recordId, operation, now, now]
  ).catch(() => {
    pendingHint -= 1;
  });
}

/**
 * Uploads every existing local row on the first sync for a given user.
 * Without this, data created before signing in (guest mode / offline)
 * would never leave the device because the queue only records changes
 * made after it is populated. Upserts are idempotent, so re-pushing an
 * already-synced row is harmless. Runs once per user via a settings flag.
 */
export async function ensureInitialUpload(userId: string): Promise<number> {
  const flagKey = `initial_upload_${userId}`;
  const existing = await queryFirst<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [flagKey]
  );
  if (existing?.value === '1') return 0;
  await executeSql('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [flagKey, '1']);

  let count = 0;
  for (const table of SYNC_TABLES) {
    const rows = await queryAll<{ id: string }>(`SELECT id FROM ${table}`);
    for (const row of rows) {
      await recordSyncChange(table, 'create', row.id)
        .catch(() => {})
      count += 1
    }
  }
  return count
}

export async function getPendingSyncItems(): Promise<SyncQueueRow[]> {
  const items = await queryAll<SyncQueueRow>(
    `SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY createdAt ASC LIMIT 500`
  );
  pendingHint = items.length;
  return items;
}

export async function markSyncItemDone(id: string): Promise<void> {
  await executeSql('DELETE FROM sync_queue WHERE id = ?', [id]);
  pendingHint = Math.max(0, pendingHint - 1);
}

export async function markSyncItemFailed(id: string, error: string): Promise<void> {
  await executeSql(
    `UPDATE sync_queue SET status = 'failed', lastError = ?, retryCount = retryCount + 1, updatedAt = ?
     WHERE id = ?`,
    [error.slice(0, 500), new Date().toISOString(), id]
  );
}

export async function getFailedSyncCount(): Promise<number> {
  const row = await queryFirst<{ count: number }>(
    `SELECT COUNT(*) AS count FROM sync_queue WHERE status = 'failed'`
  );
  return row?.count ?? 0;
}
