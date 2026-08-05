import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openDatabase().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = await SQLite.openDatabaseAsync('anitrack.db');
  await initializeDatabase(database);
  return database;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync('PRAGMA journal_mode = WAL;');
  await database.execAsync('PRAGMA foreign_keys = ON;');

  const schema = `
    CREATE TABLE IF NOT EXISTS crops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      variety TEXT NOT NULL DEFAULT '',
      fieldLocation TEXT NOT NULL DEFAULT '',
      plantingDate TEXT NOT NULL,
      expectedHarvestDate TEXT NOT NULL,
      actualHarvestDate TEXT,
      status TEXT NOT NULL DEFAULT 'growing',
      notes TEXT NOT NULL DEFAULT '',
      photos TEXT NOT NULL DEFAULT '[]',
      yieldEstimate REAL NOT NULL DEFAULT 0,
      yieldUnit TEXT NOT NULL DEFAULT 'kg',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS harvests (
      id TEXT PRIMARY KEY,
      cropId TEXT NOT NULL,
      harvestDate TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'kg',
      quality TEXT,
      moistureContent REAL,
      photos TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      sellingPrice REAL NOT NULL DEFAULT 0,
      buyer TEXT,
      revenue REAL NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (cropId) REFERENCES crops(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      cropId TEXT,
      category TEXT NOT NULL DEFAULT 'other',
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'PHP',
      date TEXT NOT NULL,
      vendor TEXT,
      receiptPhoto TEXT,
      notes TEXT NOT NULL DEFAULT '',
      recurring INTEGER NOT NULL DEFAULT 0,
      recurringInterval TEXT,
      healthRecordId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (cropId) REFERENCES crops(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS fertilizer_schedules (
      id TEXT PRIMARY KEY,
      cropId TEXT NOT NULL,
      fertilizerName TEXT NOT NULL,
      fertilizerType TEXT NOT NULL DEFAULT 'compound',
      applicationMethod TEXT NOT NULL DEFAULT 'broadcast',
      amountPerUnit REAL NOT NULL DEFAULT 0,
      totalAmount REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'kg',
      scheduledDate TEXT NOT NULL,
      completedDate TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT NOT NULL DEFAULT '',
      reminderEnabled INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (cropId) REFERENCES crops(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS weather_cache (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      temperatureHigh REAL NOT NULL DEFAULT 0,
      temperatureLow REAL NOT NULL DEFAULT 0,
      precipitation REAL NOT NULL DEFAULT 0,
      humidity REAL NOT NULL DEFAULT 0,
      windSpeed REAL NOT NULL DEFAULT 0,
      conditions TEXT NOT NULL DEFAULT 'clear',
      location TEXT NOT NULL DEFAULT '',
      dataSource TEXT NOT NULL DEFAULT 'cache',
      notes TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      data TEXT,
      scheduledAt TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      channel TEXT NOT NULL DEFAULT 'general',
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS backup_history (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      sizeBytes INTEGER NOT NULL DEFAULT 0,
      recordCount INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'completed',
      fileUri TEXT
    );
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      recordId TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      retryCount INTEGER NOT NULL DEFAULT 0,
      lastError TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS animals (
      id TEXT PRIMARY KEY,
      tagNumber TEXT NOT NULL,
      name TEXT,
      species TEXT NOT NULL DEFAULT 'Cattle',
      breed TEXT,
      birthDate TEXT,
      sex TEXT NOT NULL DEFAULT 'female',
      weight REAL,
      weightUnit TEXT NOT NULL DEFAULT 'kg',
      status TEXT NOT NULL DEFAULT 'active',
      location TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      photos TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS animal_health_records (
      id TEXT PRIMARY KEY,
      animalId TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'examination',
      diagnosis TEXT,
      medication TEXT,
      dosage TEXT,
      veterinarian TEXT,
      cost REAL,
      notes TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS fields (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      acreage REAL NOT NULL DEFAULT 0,
      soilType TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS farm_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'other',
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'pending',
      dueDate TEXT NOT NULL,
      cropId TEXT,
      fieldId TEXT,
      assignedTo TEXT,
      reminderEnabled INTEGER NOT NULL DEFAULT 0,
      reminderDate TEXT,
      completedDate TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (cropId) REFERENCES crops(id) ON DELETE SET NULL,
      FOREIGN KEY (fieldId) REFERENCES fields(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'PHP',
      month TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE (category, month)
    );
  `;

  await database.execAsync(schema);

  const expenseColumns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(expenses)');
  if (!expenseColumns.some((column) => column.name === 'healthRecordId')) {
    await database.execAsync('ALTER TABLE expenses ADD COLUMN healthRecordId TEXT');
  }
  if (!expenseColumns.some((column) => column.name === 'recurringSourceId')) {
    await database.execAsync('ALTER TABLE expenses ADD COLUMN recurringSourceId TEXT');
  }

  const cropColumns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(crops)');
  if (!cropColumns.some((column) => column.name === 'fieldId')) {
    await database.execAsync('ALTER TABLE crops ADD COLUMN fieldId TEXT');
  }

  const healthColumns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(animal_health_records)');
  if (!healthColumns.some((column) => column.name === 'updatedAt')) {
    await database.execAsync('ALTER TABLE animal_health_records ADD COLUMN updatedAt TEXT NOT NULL DEFAULT ""');
    await database.execAsync('UPDATE animal_health_records SET updatedAt = createdAt WHERE updatedAt = ""');
  }
}

export async function closeDatabase(): Promise<void> {
  const database = dbPromise ? await dbPromise : null;
  dbPromise = null;
  if (database) {
    await database.closeAsync();
  }
}

export async function executeSql(sql: string, params?: any[]): Promise<void> {
  const database = await getDatabase();
  if (params && params.length > 0) {
    await database.runAsync(sql, params);
  } else {
    await database.execAsync(sql);
  }
}

export async function queryAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await getDatabase();
  if (params.length > 0) {
    return await database.getAllAsync<T>(sql, params);
  }
  return await database.getAllAsync<T>(sql);
}

export async function queryFirst<T>(sql: string, params: any[] = []): Promise<T | null> {
  const database = await getDatabase();
  let result: T | null;
  if (params.length > 0) {
    result = await database.getFirstAsync<T>(sql, params);
  } else {
    result = await database.getFirstAsync<T>(sql);
  }
  return result || null;
}