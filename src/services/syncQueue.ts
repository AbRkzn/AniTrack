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
