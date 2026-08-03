import * as Sharing from 'expo-sharing';
import { File, Directory, Paths } from 'expo-file-system';
import { format } from 'date-fns';
import { getDatabase, closeDatabase, queryFirst, executeSql } from '../database';
import { generateId } from '../utils/helpers';

const DATABASE_NAME = 'anitrack.db';
const BACKUP_DIR_NAME = 'anitrack-backups';
const RESTORE_TEMP_NAME = 'anitrack-restore.db';

function getDatabaseFile(): File {
  return new File(Paths.document, 'SQLite', DATABASE_NAME);
}

export interface BackupResult {
  fileUri: string;
  fileName: string;
  sizeBytes: number;
}

async function recordBackup(fileName: string, sizeBytes: number): Promise<void> {
  const row = await queryFirst<{ count: number }>(
    `SELECT
       (SELECT COUNT(*) FROM crops) +
       (SELECT COUNT(*) FROM harvests) +
       (SELECT COUNT(*) FROM expenses) +
       (SELECT COUNT(*) FROM fertilizer_schedules) AS count`
  );
  await executeSql(
    `INSERT INTO backup_history (id, filename, sizeBytes, recordCount, createdAt, type, status)
     VALUES (?, ?, ?, ?, ?, 'manual', 'completed')`,
    [generateId('backup'), fileName, sizeBytes, row?.count ?? 0, new Date().toISOString()]
  );
}

export async function exportDatabaseBackup(): Promise<BackupResult> {
  const db = await getDatabase();
  await db.execAsync('PRAGMA wal_checkpoint(FULL);');

  const dbFile = getDatabaseFile();
  if (!dbFile.exists) {
    throw new Error('Database file not found.');
  }

  const backupDir = new Directory(Paths.cache, BACKUP_DIR_NAME);
  if (!backupDir.exists) {
    backupDir.create({ intermediates: true });
  }

  const fileName = `anitrack-backup-${format(new Date(), 'yyyyMMdd-HHmmss')}.db`;
  const backupFile = new File(backupDir, fileName);
  if (backupFile.exists) {
    backupFile.delete();
  }

  await dbFile.copy(backupFile);
  const sizeBytes = backupFile.size ?? 0;
  await recordBackup(fileName, sizeBytes);

  return { fileUri: backupFile.uri, fileName, sizeBytes };
}

export async function shareDatabaseBackup(): Promise<BackupResult> {
  const result = await exportDatabaseBackup();
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.fileUri, {
      mimeType: 'application/octet-stream',
      dialogTitle: `Save ${result.fileName}`,
      UTI: 'public.database',
    });
  }
  return result;
}

export interface ImportResult {
  restored: boolean;
  fileName: string | null;
}

export async function importDatabaseBackup(): Promise<ImportResult> {
  const picked = await File.pickFileAsync({
    mimeTypes: ['application/octet-stream', 'application/x-sqlite3', 'application/vnd.sqlite3', 'application/x-sqlite'],
  });
  if (picked.canceled || !picked.result) {
    return { restored: false, fileName: null };
  }

  const tempFile = new File(Paths.cache, RESTORE_TEMP_NAME);
  if (tempFile.exists) {
    tempFile.delete();
  }

  await picked.result.copy(tempFile);
  if (!tempFile.exists) {
    throw new Error('Could not read the selected file.');
  }

  await closeDatabase();

  const dbFile = getDatabaseFile();
  await tempFile.copy(dbFile, { overwrite: true });
  if (tempFile.exists) {
    tempFile.delete();
  }

  await getDatabase();

  return { restored: true, fileName: picked.result.name };
}
