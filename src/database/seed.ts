import { getDatabase } from './index';
import { setSyncQueueSuspended } from '../services/syncQueue';
import { CropRepository } from '../features/crops/repository/cropRepository';
import { HarvestRepository } from '../features/harvests/repository/harvestRepository';
import { ExpenseRepository } from '../features/expenses/repository/expenseRepository';
import { AnimalRepository } from '../features/animals/repository/animalRepository';
import { AnimalHealthRecordRepository } from '../features/animals/repository/animalHealthRecordRepository';
import { FieldRepository } from '../features/fields/repository/fieldRepository';
import { TaskRepository } from '../features/tasks/repository/taskRepository';
import { BudgetRepository } from '../features/budgets/repository/budgetRepository';
import { Crop, Harvest, Expense, Animal, AnimalHealthRecord, Field, FarmTask, Budget } from '../types';

const SEED_FLAG = 'sample_data_seeded';

const cropRepository = new CropRepository();
const harvestRepository = new HarvestRepository();
const expenseRepository = new ExpenseRepository();
const animalRepository = new AnimalRepository();
const healthRepository = new AnimalHealthRecordRepository();
const fieldRepository = new FieldRepository();
const taskRepository = new TaskRepository();
const budgetRepository = new BudgetRepository();

const SAMPLE_FIELDS: Omit<Field, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'North Field', acreage: 2.5, soilType: 'Clay loam', notes: 'Main maize plot.' },
  { name: 'East Field', acreage: 3, soilType: 'Loam', notes: '' },
  { name: 'Greenhouse A', acreage: 0.5, soilType: 'Potting mix', notes: 'Protected cropping.' },
  { name: 'West Field', acreage: 1.8, soilType: 'Silt loam', notes: '' },
  { name: 'South Field', acreage: 2.2, soilType: 'Sandy loam', notes: 'Reserved for dry-season vegetable rotation.' },
  { name: 'Orchard', acreage: 1.5, soilType: 'Sandy loam', notes: 'Mango, citrus and coconut trees.' },
  { name: 'Pasture', acreage: 4, soilType: 'Mixed grass', notes: 'Grazing for carabao and cattle.' },
];

type SampleTask = Omit<FarmTask, 'id' | 'createdAt' | 'updatedAt' | 'cropId' | 'fieldId'> & {
  cropName?: string;
  fieldName?: string;
};

const SAMPLE_TASKS: SampleTask[] = [
  {
    title: 'Top-dress maize with urea',
    description: 'Apply second round of urea to the standing maize.',
    category: 'fertilizing',
    priority: 'high',
    status: 'pending',
    dueDate: '2026-08-06',
    cropName: 'Maize',
    fieldName: 'North Field',
    assignedTo: '',
    reminderEnabled: true,
    reminderDate: '2026-08-05',
  },
  {
    title: 'Harvest ripe tomatoes',
    description: 'Third picking round, target 300kg for the local market.',
    category: 'harvesting',
    priority: 'medium',
    status: 'in_progress',
    dueDate: '2026-08-04',
    cropName: 'Tomatoes',
    fieldName: 'Greenhouse A',
    assignedTo: 'Farmhands',
    reminderEnabled: true,
    reminderDate: '2026-08-03',
  },
  {
    title: 'Irrigation pump service',
    description: 'Check filters and refill fuel before the dry spell.',
    category: 'maintenance',
    priority: 'medium',
    status: 'pending',
    dueDate: '2026-08-10',
    cropName: undefined,
    fieldName: undefined,
    assignedTo: '',
    reminderEnabled: false,
    reminderDate: undefined,
  },
  {
    title: 'Scout maize for fall armyworm',
    description: 'Walk the field and check for larvae on the whorl.',
    category: 'pest_control',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-08-02',
    cropName: 'Maize',
    fieldName: 'North Field',
    assignedTo: '',
    reminderEnabled: true,
    reminderDate: '2026-08-02',
  },
  {
    title: 'Transplant cabbage seedlings',
    description: 'Move seedlings from the nursery to the west plots.',
    category: 'planting',
    priority: 'medium',
    status: 'pending',
    dueDate: '2026-08-12',
    cropName: 'Cabbage',
    fieldName: 'West Field',
    assignedTo: 'Farmhands',
    reminderEnabled: true,
    reminderDate: '2026-08-11',
  },
  {
    title: 'Check drip lines for blockages',
    description: 'Flush emitters and replace any damaged fittings.',
    category: 'watering',
    priority: 'low',
    status: 'completed',
    completedDate: '2026-08-01',
    dueDate: '2026-08-01',
    cropName: 'Tomatoes',
    fieldName: 'Greenhouse A',
    assignedTo: '',
    reminderEnabled: false,
    reminderDate: undefined,
  },
  {
    title: 'Buy onion seed for dry season',
    description: 'Source Red Creole seed and soil amendments.',
    category: 'administrative',
    priority: 'low',
    status: 'pending',
    dueDate: '2026-08-15',
    cropName: undefined,
    fieldName: undefined,
    assignedTo: '',
    reminderEnabled: false,
    reminderDate: undefined,
  },
  {
    title: 'Repair West Field fence line',
    description: 'Replace three broken posts and re-strain the wire.',
    category: 'maintenance',
    priority: 'high',
    status: 'completed',
    completedDate: '2026-07-29',
    dueDate: '2026-07-29',
    cropName: undefined,
    fieldName: 'West Field',
    assignedTo: 'Farmhands',
    reminderEnabled: false,
    reminderDate: undefined,
  },
  {
    title: 'Fungicide spray on tomatoes',
    description: 'Preventive spray for late blight after the rains.',
    category: 'pest_control',
    priority: 'medium',
    status: 'cancelled',
    dueDate: '2026-07-30',
    cropName: 'Tomatoes',
    fieldName: 'Greenhouse A',
    assignedTo: '',
    reminderEnabled: false,
    reminderDate: undefined,
  },
];

const SAMPLE_BUDGETS: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { category: 'fertilizer', amount: 200, currency: 'PHP', month: '2026-08', notes: '' },
  { category: 'labor', amount: 300, currency: 'PHP', month: '2026-08', notes: '' },
  { category: 'fuel', amount: 150, currency: 'PHP', month: '2026-08', notes: '' },
];

type SampleCrop = Omit<Crop, 'id' | 'createdAt' | 'updatedAt' | 'fieldId'> & { fieldName?: string };

const SAMPLE_CROPS: SampleCrop[] = [
  {
    name: 'Maize',
    variety: 'SC 403',
    fieldLocation: 'North Field, Plot 1',
    fieldName: 'North Field',
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
    fieldName: 'Greenhouse A',
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
    fieldName: 'East Field',
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
    fieldName: 'West Field',
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

async function insertFields(): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  for (const field of SAMPLE_FIELDS) {
    const created = await fieldRepository.create(field);
    ids[field.name] = created.id;
  }
  return ids;
}

async function insertCrops(fieldIds: Record<string, string>): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  for (const crop of SAMPLE_CROPS) {
    const { fieldName, ...payload } = crop;
    const created = await cropRepository.create({
      ...payload,
      fieldId: fieldName ? fieldIds[fieldName] : undefined,
    });
    ids[crop.name] = created.id;
  }
  return ids;
}

async function insertTasks(cropIds: Record<string, string>, fieldIds: Record<string, string>): Promise<void> {
  for (const task of SAMPLE_TASKS) {
    const { cropName, fieldName, ...payload } = task;
    await taskRepository.create({
      ...payload,
      cropId: cropName ? cropIds[cropName] : undefined,
      fieldId: fieldName ? fieldIds[fieldName] : undefined,
    });
  }
}

async function insertBudgets(): Promise<void> {
  for (const budget of SAMPLE_BUDGETS) {
    await budgetRepository.create(budget);
  }
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

const SAMPLE_ANIMALS: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    tagNumber: 'CB-001',
    name: 'Buko',
    species: 'Carabao',
    birthDate: '2023-05-20',
    sex: 'female',
    weight: 520,
    weightUnit: 'kg',
    status: 'active',
    location: 'Corral 1',
    notes: 'Primary draft animal, gentle temperament.',
    photos: [],
  },
  {
    tagNumber: 'CB-002',
    name: 'Pula',
    species: 'Carabao',
    breed: 'Philippine',
    birthDate: '2024-01-15',
    sex: 'female',
    weight: 380,
    weightUnit: 'kg',
    status: 'active',
    location: 'Corral 1',
    notes: '',
    photos: [],
  },
  {
    tagNumber: 'CB-003',
    name: 'Saging',
    species: 'Carabao',
    breed: 'Philippine',
    birthDate: '2024-08-19',
    sex: 'female',
    weight: 340,
    weightUnit: 'kg',
    status: 'active',
    location: 'Corral 2',
    notes: 'Young heifer, being trained for draft work.',
    photos: [],
  },
  {
    tagNumber: 'C-101',
    name: 'Daisy',
    species: 'Cattle',
    breed: 'Brahman',
    birthDate: '2022-08-01',
    sex: 'female',
    weight: 610,
    weightUnit: 'kg',
    status: 'active',
    location: 'Barn 2',
    notes: 'Milking cow, morning and afternoon milkings.',
    photos: [],
  },
  {
    tagNumber: 'C-102',
    name: 'Maximo',
    species: 'Cattle',
    breed: 'Native',
    birthDate: '2021-11-02',
    sex: 'male',
    weight: 540,
    weightUnit: 'kg',
    status: 'active',
    location: 'Barn 2',
    notes: 'Stud bull kept for breeding.',
    photos: [],
  },
  {
    tagNumber: 'G-201',
    name: 'Jack',
    species: 'Goat',
    breed: 'Boer',
    birthDate: '2025-02-10',
    sex: 'male',
    weight: 55,
    weightUnit: 'kg',
    status: 'sold',
    location: 'Goat pen',
    notes: 'Sold at the town fiesta market.',
    photos: [],
  },
  {
    tagNumber: 'G-202',
    name: 'Puti',
    species: 'Goat',
    breed: 'Saanen',
    birthDate: '2024-05-30',
    sex: 'female',
    weight: 48,
    weightUnit: 'kg',
    status: 'active',
    location: 'Goat pen',
    notes: 'High milk production line.',
    photos: [],
  },
  {
    tagNumber: 'G-203',
    name: 'Kambing',
    species: 'Goat',
    breed: 'Native',
    birthDate: '2023-09-14',
    sex: 'female',
    weight: 42,
    weightUnit: 'kg',
    status: 'transferred',
    location: 'Goat pen',
    notes: 'Transferred to a partner farm in Bulacan.',
    photos: [],
  },
  {
    tagNumber: 'S-101',
    name: 'Tupa',
    species: 'Sheep',
    breed: 'Dorper',
    birthDate: '2024-11-11',
    sex: 'female',
    weight: 52,
    weightUnit: 'kg',
    status: 'active',
    location: 'Sheep shed',
    notes: '',
    photos: [],
  },
  {
    tagNumber: 'P-101',
    name: 'Baboy',
    species: 'Pig',
    breed: 'Landrace',
    birthDate: '2025-01-22',
    sex: 'female',
    weight: 120,
    weightUnit: 'kg',
    status: 'active',
    location: 'Pigpen A',
    notes: 'Fattening for the December market.',
    photos: [],
  },
  {
    tagNumber: 'CH-001',
    name: 'Manok',
    species: 'Chicken',
    breed: 'Native',
    birthDate: '2023-03-10',
    sex: 'female',
    weight: 1.8,
    weightUnit: 'kg',
    status: 'deceased',
    location: 'Chicken coop',
    notes: 'Laying hen, passed from old age.',
    photos: [],
  },
  {
    tagNumber: 'D-101',
    name: 'Itik',
    species: 'Duck',
    breed: 'Pateros',
    birthDate: '2025-06-05',
    sex: 'male',
    weight: 1.9,
    weightUnit: 'kg',
    status: 'active',
    location: 'Duck pond',
    notes: 'Drake kept for breeding flock.',
    photos: [],
  },
];

const SAMPLE_HEALTH_RECORDS: Omit<AnimalHealthRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    animalId: 'C-101',
    date: '2026-05-12',
    type: 'vaccination',
    diagnosis: 'Annual booster',
    medication: 'Brucellosis vaccine',
    dosage: '2ml',
    veterinarian: 'Dr. Santos',
    cost: 350,
    notes: 'Routine annual vaccination.',
  },
  {
    animalId: 'C-101',
    date: '2026-03-02',
    type: 'examination',
    diagnosis: 'Routine health check',
    veterinarian: 'Dr. Santos',
    cost: 200,
    notes: 'Vital signs normal, weight stable.',
  },
  {
    animalId: 'C-101',
    date: '2025-09-14',
    type: 'treatment',
    diagnosis: 'Mastitis (right front quarter)',
    medication: 'Ceftiofur injection',
    dosage: '10ml',
    veterinarian: 'Dr. Santos',
    cost: 480,
    notes: 'Milk withheld for 5 days, recovered fully.',
  },
  {
    animalId: 'CB-001',
    date: '2026-06-20',
    type: 'treatment',
    diagnosis: 'Minor hoof infection',
    medication: 'Iodine solution',
    dosage: 'Apply daily',
    veterinarian: 'Dr. Reyes',
    cost: 150,
    notes: 'Cleaned and dressed the hoof, keep dry for a week.',
  },
  {
    animalId: 'CB-001',
    date: '2026-02-14',
    type: 'examination',
    diagnosis: 'Pregnancy check',
    veterinarian: 'Dr. Reyes',
    cost: 300,
    notes: 'Confirmed pregnant, est. calving around September.',
  },
  {
    animalId: 'CB-001',
    date: '2025-11-05',
    type: 'vaccination',
    diagnosis: 'Deworming',
    medication: 'Fenbendazole',
    dosage: '10ml oral',
    veterinarian: 'Dr. Reyes',
    cost: 90,
    notes: '',
  },
  {
    animalId: 'CB-002',
    date: '2026-07-08',
    type: 'examination',
    diagnosis: 'Pregnancy check',
    veterinarian: 'Dr. Reyes',
    cost: 300,
    notes: 'Not yet confirmed, recheck next month.',
  },
  {
    animalId: 'CB-002',
    date: '2026-04-30',
    type: 'vaccination',
    diagnosis: 'Deworming',
    medication: 'Ivermectin',
    dosage: '5ml subcutaneous',
    veterinarian: 'Dr. Reyes',
    cost: 95,
    notes: '',
  },
  {
    animalId: 'C-102',
    date: '2026-06-25',
    type: 'vaccination',
    diagnosis: 'FMD vaccination',
    medication: 'Foot and mouth vaccine',
    dosage: '2ml',
    veterinarian: 'Dr. Santos',
    cost: 400,
    notes: 'Second dose of the season.',
  },
  {
    animalId: 'C-102',
    date: '2026-02-10',
    type: 'examination',
    diagnosis: 'Breeding soundness exam',
    veterinarian: 'Dr. Santos',
    cost: 350,
    notes: 'Semen quality good, cleared for breeding season.',
  },
  {
    animalId: 'G-202',
    date: '2026-04-18',
    type: 'surgery',
    diagnosis: 'Dehorning',
    veterinarian: 'Dr. Reyes',
    cost: 250,
    notes: 'Recovered well after procedure.',
  },
  {
    animalId: 'G-202',
    date: '2026-01-22',
    type: 'treatment',
    diagnosis: 'Scours (diarrhea)',
    medication: 'Oral electrolytes + antibiotics',
    dosage: 'Twice daily for 3 days',
    veterinarian: 'Dr. Reyes',
    cost: 120,
    notes: 'Kept isolated, resolved within the week.',
  },
  {
    animalId: 'D-101',
    date: '2026-06-30',
    type: 'vaccination',
    diagnosis: 'Duck cholera vaccination',
    medication: 'Duck cholera vaccine',
    dosage: '0.5ml subcutaneous',
    veterinarian: 'Dr. Reyes',
    cost: 120,
    notes: 'Whole flock vaccinated.',
  },
  {
    animalId: 'D-101',
    date: '2026-04-12',
    type: 'treatment',
    diagnosis: 'Bumblefoot (foot pad infection)',
    medication: 'Antibiotic ointment',
    dosage: 'Apply twice daily',
    veterinarian: 'Dr. Reyes',
    cost: 80,
    notes: 'Kept on clean dry bedding until healed.',
  },
  {
    animalId: 'D-101',
    date: '2026-02-03',
    type: 'examination',
    diagnosis: 'Routine health check',
    veterinarian: 'Dr. Santos',
    cost: 100,
    notes: 'Feathers and appetite normal.',
  },
  {
    animalId: 'S-101',
    date: '2026-05-28',
    type: 'treatment',
    diagnosis: 'Hoof trimming (laminitis prevention)',
    veterinarian: 'Dr. Santos',
    cost: 180,
    notes: 'Trimmed all four hooves, gait improved.',
  },
  {
    animalId: 'P-101',
    date: '2026-06-05',
    type: 'vaccination',
    diagnosis: 'Hog cholera vaccination',
    medication: 'Hog cholera vaccine',
    dosage: '2ml intramuscular',
    veterinarian: 'Dr. Santos',
    cost: 220,
    notes: 'Booster due next year.',
  },
  {
    animalId: 'P-101',
    date: '2026-03-15',
    type: 'treatment',
    diagnosis: 'Intestinal worms',
    medication: 'Ivermectin',
    dosage: '1ml per 33kg',
    veterinarian: 'Dr. Reyes',
    cost: 130,
    notes: 'Repeat in 2 weeks.',
  },
  {
    animalId: 'CH-001',
    date: '2026-01-10',
    type: 'vaccination',
    diagnosis: 'Newcastle disease vaccination',
    medication: 'Newcastle disease vaccine',
    dosage: '0.2ml',
    veterinarian: 'Dr. Santos',
    cost: 60,
    notes: 'Applied before the laying season.',
  },
  {
    animalId: 'G-201',
    date: '2026-05-02',
    type: 'examination',
    diagnosis: 'Routine health check',
    veterinarian: 'Dr. Reyes',
    cost: 100,
    notes: 'All vitals normal.',
  },
];

async function insertAnimals(): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  for (const animal of SAMPLE_ANIMALS) {
    const created = await animalRepository.create(animal);
    ids[animal.tagNumber] = created.id;
  }
  return ids;
}

async function insertHealthRecords(animalIds: Record<string, string>): Promise<void> {
  for (const record of SAMPLE_HEALTH_RECORDS) {
    const animalId = animalIds[record.animalId];
    if (!animalId) continue;
    await healthRepository.create({ ...record, animalId });
  }
}

export async function seedAnimalsIfEmpty(): Promise<void> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM animals');
  if (existing && existing.count > 0) return;
  const animalIds = await insertAnimals();
  await insertHealthRecords(animalIds);
}

export async function seedHealthRecordsIfEmpty(): Promise<void> {
  const db = await getDatabase();
  const tagNumbers = [...new Set(SAMPLE_HEALTH_RECORDS.map((record) => record.animalId))];
  const animalIds: Record<string, string> = {};
  for (const tagNumber of tagNumbers) {
    const animal = await db.getFirstAsync<{ id: string }>('SELECT id FROM animals WHERE tagNumber = ?', [tagNumber]);
    if (animal) animalIds[tagNumber] = animal.id;
  }
  if (Object.keys(animalIds).length === 0) {
    const anyAnimals = await db.getAllAsync<{ id: string }>('SELECT id FROM animals LIMIT 5');
    if (anyAnimals.length === 0) return;
    const fallbackRecords = SAMPLE_HEALTH_RECORDS.slice(0, anyAnimals.length * 2).map((record) => ({ ...record }));
    fallbackRecords.forEach((record, index) => {
      record.animalId = anyAnimals[index % anyAnimals.length].id;
    });
    for (const record of fallbackRecords) {
      await healthRepository.create(record);
    }
    return;
  }
  for (const tagNumber of Object.keys(animalIds)) {
    const animalId = animalIds[tagNumber];
    const has = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM animal_health_records WHERE animalId = ?',
      [animalId]
    );
    if (has && has.count > 0) continue;
    for (const record of SAMPLE_HEALTH_RECORDS) {
      if (record.animalId !== tagNumber) continue;
      await healthRepository.create({ ...record, animalId });
    }
  }
}

export async function seedHealthRecordExpensesIfEmpty(): Promise<void> {
  const db = await getDatabase();
  const records = await db.getAllAsync<any>(
    `SELECT id, date, type, diagnosis, veterinarian, cost FROM animal_health_records
     WHERE cost IS NOT NULL AND cost > 0
       AND NOT EXISTS (SELECT 1 FROM expenses WHERE expenses.healthRecordId = animal_health_records.id)`
  );
  for (const row of records) {
    const notes = [
      row.type.replace(/_/g, ' '),
      row.diagnosis,
      row.veterinarian ? `Vet: ${row.veterinarian}` : '',
    ].filter(Boolean).join(' - ');
    await expenseRepository.create({
      category: 'veterinary',
      amount: row.cost,
      currency: 'PHP',
      date: row.date,
      vendor: row.veterinarian || undefined,
      notes,
      healthRecordId: row.id,
      recurring: false,
    });
  }
}

export async function clearAppData(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM harvests');
  await db.runAsync('DELETE FROM fertilizer_schedules');
  await db.runAsync('DELETE FROM expenses');
  await db.runAsync('DELETE FROM crops');
  await db.runAsync('DELETE FROM farm_tasks');
  await db.runAsync('DELETE FROM budgets');
  await db.runAsync('DELETE FROM fields');
  await db.runAsync('DELETE FROM animal_health_records');
  await db.runAsync('DELETE FROM animals');
  await db.runAsync('DELETE FROM settings WHERE key = ?', [SEED_FLAG]);
  await db.runAsync('DELETE FROM sync_queue');
}

async function insertSampleData(): Promise<void> {
  const db = await getDatabase();
  const fieldIds = await insertFields();
  const cropIds = await insertCrops(fieldIds);
  await insertHarvests(cropIds);
  await insertExpenses(cropIds);
  await insertTasks(cropIds, fieldIds);
  await insertBudgets();
  const animalIds = await insertAnimals();
  await insertHealthRecords(animalIds);

  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [SEED_FLAG, '1']);
}

async function suspendSyncQueue<T>(fn: () => Promise<T>): Promise<T> {
  setSyncQueueSuspended(true);
  try {
    return await fn();
  } finally {
    setSyncQueueSuspended(false);
  }
}

export async function seedSampleData(): Promise<void> {
  await clearAppData();
  await suspendSyncQueue(() => insertSampleData());
}

export async function seedIfEmpty(): Promise<void> {
  const db = await getDatabase();

  await suspendSyncQueue(async () => {
    await seedAnimalsIfEmpty();
    await seedHealthRecordsIfEmpty();
    await seedHealthRecordExpensesIfEmpty();

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
  });
}
