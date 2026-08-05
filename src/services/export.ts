import * as Sharing from 'expo-sharing';
import { File, Directory, Paths } from 'expo-file-system';
import { format } from 'date-fns';
import { queryAll } from '../database';
import { getStatusLabel } from '../utils/helpers';
import type { IconName } from '../components/ui/Icon';
import { createWorkbookBytes, XlsxSheet } from './xlsx';

const EXPORT_DIR_NAME = 'anitrack-exports';

export type ExportDataset =
  | 'crops'
  | 'harvests'
  | 'expenses'
  | 'fertilizer'
  | 'animals'
  | 'health_records'
  | 'animal_products'
  | 'tasks'
  | 'fields'
  | 'budgets';

export const EXPORT_DATASETS: { key: ExportDataset; label: string; icon: IconName }[] = [
  { key: 'crops', label: 'Crops', icon: 'leaf-outline' },
  { key: 'harvests', label: 'Harvests', icon: 'basket-outline' },
  { key: 'expenses', label: 'Expenses', icon: 'wallet-outline' },
  { key: 'fertilizer', label: 'Fertilizer Applications', icon: 'flask-outline' },
  { key: 'animals', label: 'Animals', icon: 'paw-outline' },
  { key: 'health_records', label: 'Animal Health Records', icon: 'medkit-outline' },
  { key: 'animal_products', label: 'Animal Products', icon: 'egg-outline' },
  { key: 'tasks', label: 'Farm Tasks', icon: 'checkmark-done-outline' },
  { key: 'fields', label: 'Land Fields', icon: 'map-outline' },
  { key: 'budgets', label: 'Budgets', icon: 'pie-chart-outline' },
];

type Cell = string | number | boolean | null | undefined;

export function toCsv(columns: string[], rows: Cell[][]): string {
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n\r]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
    return str;
  };
  const header = columns.map(escape).join(',');
  const body = rows.map((row) => row.map(escape).join(',')).join('\n');
  return `${header}\n${body}\n`;
}

export interface ExportResult {
  fileUri: string;
  fileName: string;
  sizeBytes: number;
}

async function writeAndShareFile(fileName: string, contents: string | Uint8Array, mimeType: string, uti?: string): Promise<ExportResult> {
  const dir = new Directory(Paths.cache, EXPORT_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  const file = new File(dir, fileName);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(contents);
  const sizeBytes = file.size ?? 0;

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType,
      dialogTitle: `Save ${fileName}`,
      UTI: uti,
    });
  }
  return { fileUri: file.uri, fileName, sizeBytes };
}

function stamp(): string {
  return format(new Date(), 'yyyyMMdd-HHmmss');
}

// ---------------------------------------------------------------------------
// Sheet builders (columns + rows) shared by CSV and XLSX export
// ---------------------------------------------------------------------------

async function buildCropsSheet(): Promise<XlsxSheet> {
  const rows = await queryAll<any>('SELECT * FROM crops ORDER BY plantingDate DESC');
  return {
    name: 'Crops',
    columns: ['Name', 'Variety', 'Field Location', 'Field ID', 'Planting Date', 'Expected Harvest', 'Actual Harvest', 'Status', 'Yield Estimate', 'Yield Unit', 'Notes', 'Created At'],
    rows: rows.map((r) => [
      r.name,
      r.variety,
      r.fieldLocation,
      r.fieldId || '',
      r.plantingDate,
      r.expectedHarvestDate,
      r.actualHarvestDate || '',
      getStatusLabel(r.status),
      r.yieldEstimate,
      r.yieldUnit,
      r.notes,
      r.createdAt,
    ]),
  };
}

async function buildHarvestsSheet(): Promise<XlsxSheet> {
  const rows = await queryAll<any>(
    `SELECT h.*, c.name AS cropName FROM harvests h LEFT JOIN crops c ON c.id = h.cropId ORDER BY h.harvestDate DESC`
  );
  return {
    name: 'Harvests',
    columns: ['Crop', 'Harvest Date', 'Quantity', 'Unit', 'Quality', 'Moisture (%)', 'Selling Price', 'Buyer', 'Revenue', 'Notes', 'Created At'],
    rows: rows.map((r) => [
      r.cropName || r.cropId,
      r.harvestDate,
      r.quantity,
      r.unit,
      r.quality || '',
      r.moistureContent ?? '',
      r.sellingPrice ?? '',
      r.buyer || '',
      r.revenue ?? '',
      r.notes,
      r.createdAt,
    ]),
  };
}

async function buildExpensesSheet(): Promise<XlsxSheet> {
  const rows = await queryAll<any>(
    `SELECT e.*, c.name AS cropName FROM expenses e LEFT JOIN crops c ON c.id = e.cropId ORDER BY e.date DESC`
  );
  return {
    name: 'Expenses',
    columns: ['Category', 'Amount', 'Currency', 'Date', 'Crop', 'Vendor', 'Recurring', 'Notes', 'Created At'],
    rows: rows.map((r) => [
      getStatusLabel(r.category),
      r.amount,
      r.currency,
      r.date,
      r.cropName || r.cropId || '',
      r.vendor || '',
      r.recurring === 1 ? 'Yes' : 'No',
      r.notes,
      r.createdAt,
    ]),
  };
}

async function buildFertilizerSheet(): Promise<XlsxSheet> {
  const rows = await queryAll<any>(
    `SELECT f.*, c.name AS cropName FROM fertilizer_schedules f LEFT JOIN crops c ON c.id = f.cropId ORDER BY f.scheduledDate ASC`
  );
  return {
    name: 'Fertilizer',
    columns: ['Crop', 'Fertilizer', 'Type', 'Method', 'Amount', 'Total Amount', 'Unit', 'Scheduled Date', 'Completed Date', 'Status', 'Reminder', 'Notes', 'Created At'],
    rows: rows.map((r) => [
      r.cropName || r.cropId,
      r.fertilizerName,
      getStatusLabel(r.fertilizerType),
      getStatusLabel(r.applicationMethod),
      r.amountPerUnit,
      r.totalAmount,
      r.unit,
      r.scheduledDate,
      r.completedDate || '',
      getStatusLabel(r.status),
      r.reminderEnabled === 1 ? 'Yes' : 'No',
      r.notes,
      r.createdAt,
    ]),
  };
}

async function buildAnimalsSheet(): Promise<XlsxSheet> {
  const rows = await queryAll<any>('SELECT * FROM animals ORDER BY tagNumber ASC');
  return {
    name: 'Animals',
    columns: ['Tag Number', 'Name', 'Species', 'Breed', 'Birth Date', 'Sex', 'Weight', 'Weight Unit', 'Status', 'Location', 'Notes', 'Created At'],
    rows: rows.map((r) => [
      r.tagNumber,
      r.name || '',
      r.species,
      r.breed || '',
      r.birthDate || '',
      r.sex,
      r.weight ?? '',
      r.weightUnit,
      getStatusLabel(r.status),
      r.location || '',
      r.notes,
      r.createdAt,
    ]),
  };
}

async function buildHealthRecordsSheet(): Promise<XlsxSheet> {
  const rows = await queryAll<any>(
    `SELECT hr.*, a.tagNumber, a.name AS animalName FROM animal_health_records hr LEFT JOIN animals a ON a.id = hr.animalId ORDER BY hr.date DESC`
  );
  return {
    name: 'Health Records',
    columns: ['Animal', 'Date', 'Type', 'Diagnosis', 'Medication', 'Dosage', 'Veterinarian', 'Cost', 'Notes', 'Created At'],
    rows: rows.map((r) => [
      r.animalName || r.tagNumber || r.animalId,
      r.date,
      getStatusLabel(r.type),
      r.diagnosis || '',
      r.medication || '',
      r.dosage || '',
      r.veterinarian || '',
      r.cost ?? '',
      r.notes,
      r.createdAt,
    ]),
  };
}

async function buildAnimalProductsSheet(): Promise<XlsxSheet> {
  const rows = await queryAll<any>(
    `SELECT ap.*, a.tagNumber, a.name AS animalName FROM animal_products ap LEFT JOIN animals a ON a.id = ap.animalId ORDER BY ap.date DESC`
  );
  return {
    name: 'Animal Products',
    columns: ['Animal', 'Product', 'Date', 'Quantity', 'Unit', 'Selling Price', 'Buyer', 'Revenue', 'Notes', 'Created At'],
    rows: rows.map((r) => [
      r.animalName || r.tagNumber || r.animalId,
      getStatusLabel(r.productType),
      r.date,
      r.quantity,
      r.unit,
      r.sellingPrice ?? '',
      r.buyer || '',
      r.revenue ?? '',
      r.notes,
      r.createdAt,
    ]),
  };
}

async function buildTasksSheet(): Promise<XlsxSheet> {
  const rows = await queryAll<any>(
    `SELECT t.*, c.name AS cropName, f.name AS fieldName FROM farm_tasks t
     LEFT JOIN crops c ON c.id = t.cropId LEFT JOIN fields f ON f.id = t.fieldId ORDER BY t.dueDate ASC`
  );
  return {
    name: 'Tasks',
    columns: ['Title', 'Description', 'Category', 'Priority', 'Status', 'Due Date', 'Crop', 'Field', 'Assigned To', 'Reminder', 'Reminder Date', 'Completed Date', 'Created At'],
    rows: rows.map((r) => [
      r.title,
      r.description,
      getStatusLabel(r.category),
      r.priority,
      getStatusLabel(r.status),
      r.dueDate,
      r.cropName || r.cropId || '',
      r.fieldName || r.fieldId || '',
      r.assignedTo || '',
      r.reminderEnabled === 1 ? 'Yes' : 'No',
      r.reminderDate || '',
      r.completedDate || '',
      r.createdAt,
    ]),
  };
}

async function buildFieldsSheet(): Promise<XlsxSheet> {
  const rows = await queryAll<any>('SELECT * FROM fields ORDER BY name ASC');
  return {
    name: 'Fields',
    columns: ['Name', 'Acreage', 'Soil Type', 'Notes', 'Created At'],
    rows: rows.map((r) => [r.name, r.acreage, r.soilType || '', r.notes, r.createdAt]),
  };
}

async function buildBudgetsSheet(): Promise<XlsxSheet> {
  const rows = await queryAll<any>('SELECT * FROM budgets ORDER BY month DESC, category ASC');
  return {
    name: 'Budgets',
    columns: ['Category', 'Amount', 'Currency', 'Month', 'Notes', 'Created At'],
    rows: rows.map((r) => [getStatusLabel(r.category), r.amount, r.currency, r.month, r.notes || '', r.createdAt]),
  };
}

const SHEET_BUILDERS: Record<ExportDataset, () => Promise<XlsxSheet>> = {
  crops: buildCropsSheet,
  harvests: buildHarvestsSheet,
  expenses: buildExpensesSheet,
  fertilizer: buildFertilizerSheet,
  animals: buildAnimalsSheet,
  health_records: buildHealthRecordsSheet,
  animal_products: buildAnimalProductsSheet,
  tasks: buildTasksSheet,
  fields: buildFieldsSheet,
  budgets: buildBudgetsSheet,
};

const BUILDERS: Record<ExportDataset, () => Promise<string>> = Object.fromEntries(
  (Object.keys(SHEET_BUILDERS) as ExportDataset[]).map((key) => [
    key,
    async () => {
      const sheet = await SHEET_BUILDERS[key]();
      return toCsv(sheet.columns, sheet.rows);
    },
  ])
) as Record<ExportDataset, () => Promise<string>>;

export function getExportFileName(dataset: ExportDataset): string {
  const names: Record<ExportDataset, string> = {
    crops: 'crops',
    harvests: 'harvests',
    expenses: 'expenses',
    fertilizer: 'fertilizer-applications',
    animals: 'animals',
    health_records: 'animal-health-records',
    animal_products: 'animal-products',
    tasks: 'farm-tasks',
    fields: 'fields',
    budgets: 'budgets',
  };
  return `anitrack-${names[dataset]}-${stamp()}.csv`;
}

export async function exportDatasetCsv(dataset: ExportDataset): Promise<ExportResult> {
  const csv = await BUILDERS[dataset]();
  const fileName = getExportFileName(dataset);
  if (!csv.replace(/[\r\n]+$/, '').trim()) {
    throw new Error('No records to export.');
  }
  return writeAndShareFile(fileName, csv, 'text/csv', 'public.comma-separated-values-text');
}

export async function exportAllToXlsx(): Promise<ExportResult> {
  const sheets: XlsxSheet[] = [];
  for (const dataset of Object.keys(SHEET_BUILDERS) as ExportDataset[]) {
    const sheet = await SHEET_BUILDERS[dataset]();
    if (sheet.rows.length > 0) {
      sheets.push(sheet);
    }
  }
  if (sheets.length === 0) {
    throw new Error('No records to export.');
  }
  const bytes = createWorkbookBytes(sheets);
  const fileName = `anitrack-all-data-${stamp()}.xlsx`;
  return writeAndShareFile(
    fileName,
    bytes,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'org.openxmlformats.spreadsheetml.sheet'
  );
}
