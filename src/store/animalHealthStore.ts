import { create } from 'zustand';
import { AnimalHealthRecord, AsyncState, Expense } from '../types';
import { AnimalHealthRecordRepository } from '../features/animals/repository/animalHealthRecordRepository';
import { ExpenseRepository } from '../features/expenses/repository/expenseRepository';
import { useExpensesStore } from './expensesStore';
import { useAppStore } from './appStore';

interface AnimalHealthState {
  records: AsyncState<AnimalHealthRecord[]>;
  selectedRecord: AnimalHealthRecord | null;
  fetchRecords: (animalId: string) => Promise<void>;
  fetchAllRecords: () => Promise<void>;
  getRecordById: (id: string) => Promise<AnimalHealthRecord | null>;
  addRecord: (data: Omit<AnimalHealthRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<AnimalHealthRecord>;
  updateRecord: (id: string, data: Partial<Omit<AnimalHealthRecord, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<AnimalHealthRecord>;
  deleteRecord: (id: string) => Promise<void>;
  setSelectedRecord: (record: AnimalHealthRecord | null) => void;
  clearRecords: () => void;
  clearError: () => void;
}

const repository = new AnimalHealthRecordRepository();
const expenseRepository = new ExpenseRepository();

function buildHealthExpense(record: AnimalHealthRecord): Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> {
  const typeLabel = record.type.replace(/_/g, ' ');
  const notes = [typeLabel, record.diagnosis, record.veterinarian ? `Vet: ${record.veterinarian}` : '']
    .filter(Boolean)
    .join(' - ');
  return {
    category: 'veterinary',
    amount: record.cost ?? 0,
    currency: useAppStore.getState().settings.currency,
    date: record.date,
    vendor: record.veterinarian,
    notes,
    healthRecordId: record.id,
    recurring: false,
  };
}

async function syncHealthRecordExpense(record: AnimalHealthRecord): Promise<void> {
  const hasCost = typeof record.cost === 'number' && record.cost > 0;
  const existing = await expenseRepository.getByHealthRecordId(record.id);
  const expensesStore = useExpensesStore.getState();

  if (hasCost && !existing) {
    await expensesStore.addExpense(buildHealthExpense(record));
  } else if (hasCost && existing) {
    await expensesStore.updateExpense(existing.id, {
      amount: record.cost,
      date: record.date,
      vendor: record.veterinarian,
      notes: buildHealthExpense(record).notes,
    });
  } else if (!hasCost && existing) {
    await expensesStore.deleteExpense(existing.id);
  }
}

async function removeHealthRecordExpense(healthRecordId: string): Promise<void> {
  const existing = await expenseRepository.getByHealthRecordId(healthRecordId);
  if (existing) {
    await useExpensesStore.getState().deleteExpense(existing.id);
  }
}

export const useAnimalHealthStore = create<AnimalHealthState>((set, get) => ({
  records: { data: [], isLoading: false, error: null },
  selectedRecord: null,

  fetchRecords: async (animalId) => {
    set((state) => ({ records: { ...state.records, isLoading: true, error: null } }));
    try {
      const data = await repository.getByAnimalId(animalId);
      set({ records: { data, isLoading: false, error: null } });
    } catch (error) {
      set({ records: { data: [], isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch health records' } });
    }
  },

  fetchAllRecords: async () => {
    set((state) => ({ records: { ...state.records, isLoading: true, error: null } }));
    try {
      const data = await repository.getAll();
      set({ records: { data, isLoading: false, error: null } });
    } catch (error) {
      set({ records: { data: [], isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch health records' } });
    }
  },

  getRecordById: async (id) => {
    try { return await repository.getById(id); } catch { return null; }
  },

  addRecord: async (data) => {
    try {
      const newRecord = await repository.create(data);
      set((state) => ({ records: { ...state.records, data: [newRecord, ...state.records.data] } }));
      try {
        await syncHealthRecordExpense(newRecord);
      } catch (expenseError) {
        console.warn('Failed to sync health record expense:', expenseError);
      }
      return newRecord;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add health record';
      set((state) => ({ records: { ...state.records, error: message } }));
      throw error;
    }
  },

  updateRecord: async (id, data) => {
    try {
      const updatedRecord = await repository.update(id, data);
      set((state) => ({
        records: { ...state.records, data: state.records.data.map((r) => (r.id === id ? updatedRecord : r)) },
      }));
      if (get().selectedRecord?.id === id) set({ selectedRecord: updatedRecord });
      try {
        await syncHealthRecordExpense(updatedRecord);
      } catch (expenseError) {
        console.warn('Failed to sync health record expense:', expenseError);
      }
      return updatedRecord;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update health record';
      set((state) => ({ records: { ...state.records, error: message } }));
      throw error;
    }
  },

  deleteRecord: async (id) => {
    try {
      await repository.delete(id);
      set((state) => ({ records: { ...state.records, data: state.records.data.filter((r) => r.id !== id) } }));
      if (get().selectedRecord?.id === id) set({ selectedRecord: null });
      try {
        await removeHealthRecordExpense(id);
      } catch (expenseError) {
        console.warn('Failed to remove health record expense:', expenseError);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete health record';
      set((state) => ({ records: { ...state.records, error: message } }));
      throw error;
    }
  },

  setSelectedRecord: (record) => set({ selectedRecord: record }),
  clearRecords: () => set({ records: { data: [], isLoading: false, error: null } }),
  clearError: () => set((state) => ({ records: { ...state.records, error: null } })),
}));
