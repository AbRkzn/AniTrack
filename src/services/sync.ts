import { getSupabaseClient } from './supabase';
import { queryAll, queryFirst, executeSql } from '../database';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import {
  SYNC_TABLES,
  SyncTable,
  ensureInitialUpload,
  getPendingSyncItems,
  markSyncItemDone,
  markSyncItemFailed,
  getFailedSyncCount,
  setPendingHint,
  getPendingHint,
} from './syncQueue';

const LAST_SYNC_KEY = 'last_sync_at';

export type SyncResult =
  | { status: 'ok'; pushed: number; pulled: number; failed: number }
  | { status: 'not_configured' }
  | { status: 'not_signed_in' }
  | { status: 'offline' }
  | { status: 'busy' };

async function getLastSyncAt(): Promise<string | null> {
  const row = await queryFirst<{ value: string }>('SELECT value FROM settings WHERE key = ?', [LAST_SYNC_KEY]);
  return row?.value ?? null;
}

async function setLastSyncAt(value: string): Promise<void> {
  await executeSql('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [LAST_SYNC_KEY, value]);
}

async function getLocalColumns(table: string): Promise<string[]> {
  const rows = await queryAll<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.map((row) => row.name);
}

async function pushItem(
  client: NonNullable<ReturnType<typeof getSupabaseClient>>,
  userId: string,
  table: SyncTable,
  recordId: string,
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  const now = new Date().toISOString();

  if (operation === 'delete') {
    const { error } = await client
      .from(table)
      .upsert({ id: recordId, owner_id: userId, deleted: true, updatedAt: now }, { onConflict: 'id' });
    if (error) throw error;
    return;
  }

  const row = await queryFirst<Record<string, unknown>>(`SELECT * FROM ${table} WHERE id = ?`, [recordId]);
  if (!row) {
    const { error } = await client
      .from(table)
      .upsert({ id: recordId, owner_id: userId, deleted: true, updatedAt: now }, { onConflict: 'id' });
    if (error) throw error;
    return;
  }

  const { error } = await client.from(table).upsert({ ...row, owner_id: userId, deleted: false }, { onConflict: 'id' });
  if (error) throw error;
}

async function pullTable(
  client: NonNullable<ReturnType<typeof getSupabaseClient>>,
  userId: string,
  table: SyncTable,
  since: string | null
): Promise<number> {
  let query = client.from(table).select('*').eq('owner_id', userId);
  if (since) {
    query = query.gt('updatedAt', since);
  }
  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return 0;

  const columns = await getLocalColumns(table);

  for (const remoteRow of data) {
    const { id, deleted, ...rest } = remoteRow as Record<string, unknown> & { id: string; deleted?: boolean };

    if (deleted) {
      await executeSql(`DELETE FROM ${table} WHERE id = ?`, [id]);
      continue;
    }

    if (!id) continue;

    const local = await queryFirst<{ updatedAt: string }>(`SELECT updatedAt FROM ${table} WHERE id = ?`, [id]);
    if (local && local.updatedAt && rest.updatedAt && local.updatedAt > (rest.updatedAt as string)) {
      continue;
    }

    const cols = columns.filter((column) => column !== 'id');
    if (cols.length === 0) continue;

    const placeholders = cols.map(() => '?').join(', ');
    const values = cols.map((column) => {
      const value = rest[column];
      if (typeof value === 'boolean') return value ? 1 : 0;
      return value ?? null;
    });

    await executeSql(`INSERT OR REPLACE INTO ${table} (id, ${cols.join(', ')}) VALUES (?, ${placeholders})`, [
      id,
      ...values,
    ]);
  }

  return data.length;
}

export async function syncNow(): Promise<SyncResult> {
  const client = getSupabaseClient();
  if (!client) return { status: 'not_configured' };

  const user = useAuthStore.getState().user;
  if (!user) return { status: 'not_signed_in' };

  if (!useAppStore.getState().isOnline) return { status: 'offline' };

  const { sync } = useAppStore.getState();
  if (sync.isSyncing) return { status: 'busy' };

  useAppStore.getState().updateSyncStatus({ isSyncing: true, failedCount: 0 });
  let pushed = 0;
  let pulled = 0;

  try {
    // 0) First sync for this user: upload any pre-existing local rows
    await ensureInitialUpload(user.id);

    // 1) Push pending local changes first
    const pending = await getPendingSyncItems();
    for (const item of pending) {
      if (!SYNC_TABLES.includes(item.table_name)) {
        await markSyncItemDone(item.id);
        continue;
      }
      try {
        await pushItem(client, user.id, item.table_name, item.recordId, item.operation);
        await markSyncItemDone(item.id);
        pushed += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sync failed';
        await markSyncItemFailed(item.id, message);
      }
    }

    // 2) Pull remote changes (last-writer-wins by updatedAt)
    const since = await getLastSyncAt();
    for (const table of SYNC_TABLES) {
      try {
        pulled += await pullTable(client, user.id, table, since);
      } catch (error) {
        console.warn(`Failed to pull ${table}:`, error);
      }
    }

    const failedCount = await getFailedSyncCount();
    const remaining = await getPendingSyncItems();
    setPendingHint(remaining.length);
    await setLastSyncAt(new Date().toISOString());

    useAppStore.getState().updateSyncStatus({
      isSyncing: false,
      lastSyncAt: new Date().toISOString(),
      pendingCount: remaining.length,
      failedCount,
    });

    return { status: 'ok', pushed, pulled, failed: failedCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    useAppStore.getState().updateSyncStatus({ isSyncing: false });
    console.error('Sync error:', message);
    return { status: 'ok', pushed, pulled, failed: -1 };
  }
}

export function getPendingSyncCount(): number {
  return getPendingHint();
}
