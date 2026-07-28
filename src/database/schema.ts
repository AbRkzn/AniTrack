/**
 * AniTrack SQLite Schema — Version 1
 *
 * Tables: crops, harvests, expenses, fertilizer_schedules,
 *         weather_cache, notifications, settings, backup_history
 *
 * Design notes:
 * - All primary keys are TEXT (UUID) generated client-side so records
 *   can be created fully offline and later synced to Supabase without
 *   collisions (Phase 8).
 * - Every syncable table carries created_at, updated_at, synced_at,
 *   and is_deleted (soft delete) to support the future sync engine.
 */

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS crops (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  variety TEXT,
  field_location TEXT,
  planting_date TEXT NOT NULL,
  expected_harvest_date TEXT,
  status TEXT NOT NULL DEFAULT 'growing' CHECK (status IN ('growing','ready_for_harvest','harvested','delayed')),
  notes TEXT,
  primary_photo_uri TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS crop_photos (
  id TEXT PRIMARY KEY NOT NULL,
  crop_id TEXT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  uri TEXT NOT NULL,
  caption TEXT,
  taken_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS harvests (
  id TEXT PRIMARY KEY NOT NULL,
  crop_id TEXT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  selling_price REAL,
  revenue REAL,
  harvest_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL,
  crop_id TEXT REFERENCES crops(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('seeds','fertilizer','labor','equipment','fuel','transportation','miscellaneous')),
  amount REAL NOT NULL,
  description TEXT,
  expense_date TEXT NOT NULL,
  receipt_photo_uri TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fertilizer_schedules (
  id TEXT PRIMARY KEY NOT NULL,
  crop_id TEXT NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
  fertilizer_name TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  applied_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','overdue','cancelled')),
  notification_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT,
  is_deleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS weather_cache (
  id TEXT PRIMARY KEY NOT NULL,
  location_key TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  current_temp REAL,
  condition TEXT,
  condition_icon TEXT,
  forecast_json TEXT NOT NULL,
  alerts_json TEXT,
  is_stale INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL CHECK (type IN ('fertilizer_reminder','harvest_reminder','weather_alert','system')),
  related_entity_id TEXT,
  scheduled_for TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backup_history (
  id TEXT PRIMARY KEY NOT NULL,
  file_uri TEXT NOT NULL,
  file_size_bytes INTEGER,
  record_count INTEGER,
  backup_type TEXT NOT NULL DEFAULT 'manual' CHECK (backup_type IN ('manual','automatic')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_harvests_crop_id ON harvests(crop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_crop_id ON expenses(crop_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_fertilizer_crop_id ON fertilizer_schedules(crop_id);
CREATE INDEX IF NOT EXISTS idx_fertilizer_status ON fertilizer_schedules(status);
CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(status);
CREATE INDEX IF NOT EXISTS idx_weather_location ON weather_cache(location_key);
`;
