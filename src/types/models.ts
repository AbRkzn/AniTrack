export type CropStatus = "growing" | "ready_for_harvest" | "harvested" | "delayed";

export interface Crop {
  id: string;
  name: string;
  variety: string | null;
  fieldLocation: string | null;
  plantingDate: string; // ISO date
  expectedHarvestDate: string | null;
  status: CropStatus;
  notes: string | null;
  primaryPhotoUri: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  isDeleted: boolean;
}

export interface CropPhoto {
  id: string;
  cropId: string;
  uri: string;
  caption: string | null;
  takenAt: string;
  createdAt: string;
}

export interface Harvest {
  id: string;
  cropId: string;
  quantity: number;
  unit: string;
  sellingPrice: number | null;
  revenue: number | null;
  harvestDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  isDeleted: boolean;
}

export type ExpenseCategory =
  | "seeds"
  | "fertilizer"
  | "labor"
  | "equipment"
  | "fuel"
  | "transportation"
  | "miscellaneous";

export interface Expense {
  id: string;
  cropId: string | null;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  expenseDate: string;
  receiptPhotoUri: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  isDeleted: boolean;
}

export type FertilizerStatus = "pending" | "completed" | "overdue" | "cancelled";

export interface FertilizerSchedule {
  id: string;
  cropId: string;
  fertilizerName: string;
  scheduledDate: string;
  appliedDate: string | null;
  status: FertilizerStatus;
  notificationId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  isDeleted: boolean;
}

export interface WeatherForecastDay {
  date: string;
  minTemp: number;
  maxTemp: number;
  condition: string;
  conditionIcon: string;
  precipitationChance: number;
}

export interface WeatherAlert {
  title: string;
  severity: "advisory" | "watch" | "warning";
  description: string;
}

export interface WeatherCache {
  id: string;
  locationKey: string;
  fetchedAt: string;
  currentTemp: number | null;
  condition: string | null;
  conditionIcon: string | null;
  forecast: WeatherForecastDay[];
  alerts: WeatherAlert[];
  isStale: boolean;
}

export type NotificationType =
  | "fertilizer_reminder"
  | "harvest_reminder"
  | "weather_alert"
  | "system";

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  relatedEntityId: string | null;
  scheduledFor: string | null;
  isRead: boolean;
  createdAt: string;
}

export type BackupType = "manual" | "automatic";

export interface BackupRecord {
  id: string;
  fileUri: string;
  fileSizeBytes: number | null;
  recordCount: number | null;
  backupType: BackupType;
  createdAt: string;
}
