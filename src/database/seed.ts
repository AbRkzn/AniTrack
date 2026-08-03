import { getDatabase } from './index';
import { CropRepository } from '../features/crops/repository/cropRepository';
import { HarvestRepository } from '../features/harvests/repository/harvestRepository';
import { ExpenseRepository } from '../features/expenses/repository/expenseRepository';
import { Crop, Harvest, Expense } from '../types';

const SEED_FLAG = 'sample_data_seeded';

const cropRepository = new CropRepository();
const harvestRepository = new HarvestRepository();
const expenseRepository = new ExpenseRepository();

const SAMPLE_CROPS: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Maize',
    variety: 'SC 403',
    fieldLocation: 'North Field, Plot 1',
    plantingDate: '2026-04-10',
    expectedHarvestDate: '2026-08-15',
    status: 'growing',
    notes: 'Sowed at 75cm row spacing. Top-dressed urea on 20 May.',
    photos: [],
    yieldEstimate: 4500,
    yieldUnit: 'kg',
  },
  {
    name: 'Tomatoes',
    variety: 'Roma',
    fieldLocation: 'Greenhouse A',
    plantingDate: '2026-05-01',
    expectedHarvestDate: '2026-08-01',
    status: 'ready_for_harvest',
    notes: 'Staked and pruned. Water twice daily in peak heat.',
    photos: [],
    yieldEstimate: 800,
    yieldUnit: 'kg',
  },
  {
    name: 'Soybeans',
    variety: 'TGx 1448-2E',
    fieldLocation: 'East Field, Plot 3',
    plantingDate: '2026-03-20',
    expectedHarvestDate: '2026-07-28',
    actualHarvestDate: '2026-07-30',
    status: 'harvested',
    notes: 'Good pod set. Combine harvester used.',
    photos: [],
    yieldEstimate: 1200,
    yieldUnit: 'kg',
  },
  {
    name: 'Cabbage',
    variety: 'Gloria F1',
    fieldLocation: 'West Plot, Plot 2',
    plantingDate: '2026-06-01',
    expectedHarvestDate: '2026-09-20',
    status: 'growing',
    notes: 'Transplanted seedlings after 4 weeks in the nursery.',
    photos: [],
    yieldEstimate: 2000,
    yieldUnit: 'kg',
  },
];

const SAMPLE_HARVESTS: Omit<Harvest, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    cropId: 'Soybeans',
    harvestDate: '2026-07-30',
    quantity: 1150,
    unit: 'kg',
    quality: 'Grade A',
    moistureContent: 13,
    photos: [],
    notes: 'Main season harvest, delivered to co-op the same day.',
    sellingPrice: 0.8,
    buyer: 'Farmers Co-op',
    revenue: 920,
  },
  {
    cropId: 'Tomatoes',
    harvestDate: '2026-07-25',
    quantity: 300,
    unit: 'kg',
    quality: 'Standard',
    photos: [],
    notes: 'First picking of the season.',
    sellingPrice: 1.5,
    buyer: 'Local market',
    revenue: 450,
  },
  {
    cropId: 'Tomatoes',
    harvestDate: '2026-08-01',
    quantity: 250,
    unit: 'kg',
    quality: 'Standard',
    photos: [],
    notes: 'Second picking, fruit slightly smaller.',
    sellingPrice: 1.5,
    buyer: 'Local market',
    revenue: 375,
  },
];

const SAMPLE_EXPENSES: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    cropId: 'Maize',
    category: 'seed',
    amount: 120,
    currency: 'PHP',
    date: '2026-04-05',
    vendor: 'AgriMart',
    notes: 'SC 403 seed, 1 bag (25kg).',
    recurring: false,
  },
  {
    cropId: 'Maize',
    category: 'fertilizer',
    amount: 85.5,
    currency: 'PHP',
    date: '2026-04-20',
    vendor: 'AgroChem',
    notes: 'NPK 15-15-15, 2 bags.',
    recurring: false,
  },
  {
    cropId: 'Tomatoes',
    category: 'labor',
    amount: 200,
    currency: 'PHP',
    date: '2026-05-15',
    vendor: 'Farmhands',
    notes: 'Planting and staking crew, 1 day.',
    recurring: false,
  },
  {
    cropId: undefined,
    category: 'equipment',
    amount: 450,
    currency: 'PHP',
    date: '2026-06-01',
    vendor: 'TractorHub',
    notes: 'Seasonal tractor service plus new blades.',
    recurring: false,
  },
  {
    cropId: undefined,
    category: 'irrigation',
    amount: 60,
    currency: 'PHP',
    date: '2026-07-01',
    vendor: 'Power Co',
    notes: 'Monthly irrigation pumping.',
    recurring: true,
    recurringInterval: 'monthly',
  },
  {
    cropId: 'Soybeans',
    category: 'transport',
    amount: 95,
    currency: 'PHP',
    date: '2026-07-28',
    vendor: 'Haulage Co',
    notes: 'Harvest delivery to the co-op.',
    recurring: false,
  },
];

async function insertCrops(): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  for (const crop of SAMPLE_CROPS) {
    const created = await cropRepository.create(crop);
    ids[crop.name] = created.id;
  }
  return ids;
}

async function insertHarvests(cropIds: Record<string, string>): Promise<void> {
  for (const harvest of SAMPLE_HARVESTS) {
    await harvestRepository.create({ ...harvest, cropId: cropIds[harvest.cropId] });
  }
}

async function insertExpenses(cropIds: Record<string, string>): Promise<void> {
  for (const expense of SAMPLE_EXPENSES) {
    await expenseRepository.create({
      ...expense,
      cropId: expense.cropId ? cropIds[expense.cropId] : undefined,
    });
  }
}

export async function clearAppData(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM harvests');
  await db.runAsync('DELETE FROM fertilizer_schedules');
  await db.runAsync('DELETE FROM expenses');
  await db.runAsync('DELETE FROM crops');
  await db.runAsync('DELETE FROM settings WHERE key = ?', [SEED_FLAG]);
}

async function insertSampleData(): Promise<void> {
  const db = await getDatabase();
  const cropIds = await insertCrops();
  await insertHarvests(cropIds);
  await insertExpenses(cropIds);

  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [SEED_FLAG, '1']);
}

export async function seedSampleData(): Promise<void> {
  await clearAppData();
  await insertSampleData();
}

export async function seedIfEmpty(): Promise<void> {
  const db = await getDatabase();

  const flagged = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [SEED_FLAG]
  );
  if (flagged) return;

  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM crops');
  if (existing && existing.count > 0) {
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [SEED_FLAG, '1']);
    return;
  }

  await insertSampleData();
}
