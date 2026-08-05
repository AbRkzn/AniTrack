// ---------------------------------------------------------------------------
// Core Entity Types
// ---------------------------------------------------------------------------

export type CropStatus = 'growing' | 'ready_for_harvest' | 'harvested' | 'failed';

export interface Crop {
  id: string;
  name: string;
  variety: string;
  fieldLocation: string;
  fieldId?: string;
  plantingDate: string;
  expectedHarvestDate: string;
  actualHarvestDate?: string;
  status: CropStatus;
  notes: string;
  photos: string[];
  yieldEstimate: number;
  yieldUnit: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | 'seed'
  | 'fertilizer'
  | 'pesticide'
  | 'equipment'
  | 'labor'
  | 'irrigation'
  | 'fuel'
  | 'maintenance'
  | 'transport'
  | 'utility'
  | 'insurance'
  | 'rent'
  | 'veterinary'
  | 'other';

export interface Expense {
  id: string;
  cropId?: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  vendor?: string;
  receiptPhoto?: string;
  notes: string;
  healthRecordId?: string;
  recurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringSourceId?: string;
  createdAt: string;
  updatedAt: string;
}

export type FertilizerType = 'nitrogen' | 'phosphate' | 'potash' | 'compound' | 'organic' | 'foliar' | 'other';

export type ApplicationMethod = 'broadcast' | 'banding' | 'side_dressing' | 'fertigation' | 'foliar_spray' | 'injection';

export interface FertilizerApplication {
  id: string;
  cropId: string;
  fertilizerName: string;
  fertilizerType: FertilizerType;
  applicationMethod: ApplicationMethod;
  amountPerUnit: number;
  totalAmount: number;
  unit: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  notes: string;
  reminderEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Harvest {
  id: string;
  cropId: string;
  harvestDate: string;
  quantity: number;
  unit: string;
  quality?: string;
  moistureContent?: number;
  photos: string[];
  notes: string;
  sellingPrice?: number;
  buyer?: string;
  revenue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherRecord {
  id: string;
  date: string;
  temperatureHigh: number;
  temperatureLow: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  conditions: string;
  notes: string;
  location?: string;
  dataSource?: string;
  createdAt: string;
}

export interface Field {
  id: string;
  name: string;
  acreage: number;
  soilType?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskCategory = 'planting' | 'watering' | 'fertilizing' | 'pest_control' | 'harvesting' | 'maintenance' | 'administrative' | 'other';

export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface FarmTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  cropId?: string;
  fieldId?: string;
  assignedTo?: string;
  reminderEnabled: boolean;
  reminderDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  month: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Animal {
  id: string;
  tagNumber: string;
  name?: string;
  species: string;
  breed?: string;
  birthDate?: string;
  sex: 'male' | 'female';
  weight?: number;
  weightUnit?: string;
  status: AnimalStatus;
  location?: string;
  notes: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export type AnimalStatus = 'active' | 'sold' | 'deceased' | 'transferred';

export type AnimalHealthType = 'examination' | 'vaccination' | 'treatment' | 'surgery';

export interface AnimalHealthRecord {
  id: string;
  animalId: string;
  date: string;
  type: AnimalHealthType;
  diagnosis?: string;
  medication?: string;
  dosage?: string;
  veterinarian?: string;
  cost?: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Sync & Offline Types
// ---------------------------------------------------------------------------

export type SyncOperation = 'create' | 'update' | 'delete';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';

export interface SyncQueueItem {
  id: string;
  table: string;
  recordId: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncState {
  lastSyncAt: string | null;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
}

// ---------------------------------------------------------------------------
// Backup Types
// ---------------------------------------------------------------------------

export interface Backup {
  id: string;
  filename: string;
  sizeBytes: number;
  recordCount: number;
  createdAt: string;
  type: 'automatic' | 'manual';
  status: BackupStatus;
  fileUri?: string;
}

export type BackupStatus = 'completed' | 'failed' | 'in_progress';

export interface BackupMetadata {
  version: number;
  appVersion: string;
  exportedAt: string;
  tables: string[];
  recordCounts: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Report & Chart Types
// ---------------------------------------------------------------------------

export type ReportType = 'yield_summary' | 'expense_breakdown' | 'fertilizer_usage' | 'harvest_timeline' | 'weather_impact' | 'crop_comparison';

export interface ReportConfig {
  type: ReportType;
  dateRange: DateRange;
  cropIds?: string[];
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

export interface DateRange {
  start: string;
  end: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  config: ReportConfig;
  data: ChartDataPoint[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Settings Types
// ---------------------------------------------------------------------------

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  unitSystem: 'metric' | 'imperial';
  yieldUnit: string;
  language: string;
  autoBackup: boolean;
  backupIntervalDays: number;
  syncOnWifiOnly: boolean;
  pushNotifications: boolean;
  reminderDaysBeforeHarvest: number;
  farmLatitude: number;
  farmLongitude: number;
  farmLocationName: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  currency: 'PHP',
  unitSystem: 'metric',
  yieldUnit: 'kg',
  language: 'en',
  autoBackup: false,
  backupIntervalDays: 7,
  syncOnWifiOnly: true,
  pushNotifications: true,
  reminderDaysBeforeHarvest: 7,
  farmLatitude: 15.6,
  farmLongitude: 120.96,
  farmLocationName: 'Nueva Ecija, Philippines',
};

// ---------------------------------------------------------------------------
// Form Types
// ---------------------------------------------------------------------------

export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
}

export type CropFormData = Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>;
export type ExpenseFormData = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;
export type FertilizerFormData = Omit<FertilizerApplication, 'id' | 'createdAt' | 'updatedAt'>;
export type HarvestFormData = Omit<Harvest, 'id' | 'createdAt' | 'updatedAt'>;
export type AnimalFormData = Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>;
export type AnimalHealthFormData = Omit<AnimalHealthRecord, 'id' | 'createdAt' | 'updatedAt'>;
export type FieldFormData = Omit<Field, 'id' | 'createdAt' | 'updatedAt'>;
export type TaskFormData = Omit<FarmTask, 'id' | 'createdAt' | 'updatedAt'>;
export type BudgetFormData = Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>;

// ---------------------------------------------------------------------------
// Repository Types
// ---------------------------------------------------------------------------

export interface Repository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<T>;
  update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface QueryOptions {
  offset?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
}

export interface CropQuery extends QueryOptions {
  status?: CropStatus;
  search?: string;
  fieldId?: string;
}

export interface ExpenseQuery extends QueryOptions {
  category?: ExpenseCategory;
  cropId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface FertilizerQuery extends QueryOptions {
  cropId?: string;
  fertilizerType?: FertilizerType;
  dateFrom?: string;
  dateTo?: string;
}

export interface HarvestQuery extends QueryOptions {
  cropId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AnimalQuery extends QueryOptions {
  status?: AnimalStatus;
  sex?: 'male' | 'female';
  search?: string;
}

export interface AnimalHealthQuery extends QueryOptions {
  animalId?: string;
  type?: AnimalHealthType;
  dateFrom?: string;
  dateTo?: string;
}

export interface TaskQuery extends QueryOptions {
  status?: TaskStatus;
  category?: TaskCategory;
  cropId?: string;
  fieldId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface BudgetQuery extends QueryOptions {
  category?: ExpenseCategory;
  month?: string;
}

export interface FieldQuery extends QueryOptions {
  search?: string;
}

// ---------------------------------------------------------------------------
// Store / State Types
// ---------------------------------------------------------------------------

export interface AsyncState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
}

export interface PaginatedState<T> {
  items: T[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
}

export interface CropsState {
  crops: AsyncState<Crop[]>;
  selectedCrop: Crop | null;
  filters: CropQuery;
}

export interface ExpensesState {
  expenses: AsyncState<Expense[]>;
  selectedExpense: Expense | null;
  filters: ExpenseQuery;
}

export interface FertilizerState {
  applications: AsyncState<FertilizerApplication[]>;
  selectedApplication: FertilizerApplication | null;
  filters: FertilizerQuery;
}

export interface HarvestsState {
  harvests: AsyncState<Harvest[]>;
  selectedHarvest: Harvest | null;
  filters: HarvestQuery;
}

export interface AnimalsState {
  animals: AsyncState<Animal[]>;
  selectedAnimal: Animal | null;
  filters: AnimalQuery;
}

export interface AnimalHealthState {
  records: AsyncState<AnimalHealthRecord[]>;
  selectedRecord: AnimalHealthRecord | null;
}

export interface SyncStateUI {
  sync: SyncState;
  queue: SyncQueueItem[];
}

export interface AppState {
  crops: CropsState;
  expenses: ExpensesState;
  fertilizer: FertilizerState;
  harvests: HarvestsState;
  animals: AnimalsState;
  sync: SyncStateUI;
  settings: AppSettings;
  isOnline: boolean;
}

// ---------------------------------------------------------------------------
// Database Types
// ---------------------------------------------------------------------------

export interface DatabaseMigration {
  version: number;
  name: string;
  sql: string;
  appliedAt?: string;
}

export type DatabaseTable =
  | 'crops'
  | 'expenses'
  | 'fertilizer_applications'
  | 'harvests'
  | 'weather_records'
  | 'fields'
  | 'farm_tasks'
  | 'budgets'
  | 'animals'
  | 'animal_health_records'
  | 'sync_queue'
  | 'backups'
  | 'settings';

// ---------------------------------------------------------------------------
// API / Network Types
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Notification Types
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  scheduledAt?: string;
  read: boolean;
  createdAt: string;
}

export type NotificationChannel = 'harvest_reminder' | 'task_reminder' | 'weather_alert' | 'sync_complete' | 'backup_complete';

// ---------------------------------------------------------------------------
// Utility / Helper Types
// ---------------------------------------------------------------------------

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ValueOf<T> = T[keyof T];

export type EntityMap<T extends { id: string }> = Record<string, T>;

export function isCropStatus(value: string): value is CropStatus {
  return ['growing', 'ready_for_harvest', 'harvested', 'failed'].includes(value);
}

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return [
    'seed', 'fertilizer', 'pesticide', 'equipment', 'labor',
    'irrigation', 'fuel', 'maintenance', 'transport', 'utility',
    'insurance', 'rent', 'veterinary', 'other',
  ].includes(value);
}

export function isAnimalStatus(value: string): value is AnimalStatus {
  return ['active', 'sold', 'deceased', 'transferred'].includes(value);
}

export function isAnimalHealthType(value: string): value is AnimalHealthType {
  return ['examination', 'vaccination', 'treatment', 'surgery'].includes(value);
}
