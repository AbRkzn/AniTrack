import { create } from 'zustand';
import { AnimalHealthRecord, AsyncState } from '../types';
import { AnimalHealthRecordRepository } from '../features/animals/repository/animalHealthRecordRepository';

interface AnimalHealthState {
  records: AsyncState<AnimalHealthRecord[]>;
  selectedRecord: AnimalHealthRecord | null;
  fetchRecords: (animalId: string) => Promise<void>;
  getRecordById: (id: string) => Promise<AnimalHealthRecord | null>;
  addRecord: (data: Omit<AnimalHealthRecord, 'id' | 'createdAt'>) => Promise<AnimalHealthRecord>;
  updateRecord: (id: string, data: Partial<Omit<AnimalHealthRecord, 'id' | 'createdAt'>>) => Promise<AnimalHealthRecord>;
  deleteRecord: (id: string) => Promise<void>;
  setSelectedRecord: (record: AnimalHealthRecord | null) => void;
  clearRecords: () => void;
  clearError: () => void;
}

const repository = new AnimalHealthRecordRepository();

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

  getRecordById: async (id) => {
    try { return await repository.getById(id); } catch { return null; }
  },

  addRecord: async (data) => {
    try {
      const newRecord = await repository.create(data);
      set((state) => ({ records: { ...state.records, data: [newRecord, ...state.records.data] } }));
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
