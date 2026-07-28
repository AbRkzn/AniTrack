import { create } from 'zustand';
import { FertilizerApplication, FertilizerQuery, AsyncState } from '../types';
import { FertilizerRepository } from '../features/fertilizer/repository/fertilizerRepository';

interface FertilizerState {
  applications: AsyncState<FertilizerApplication[]>;
  selectedApplication: FertilizerApplication | null;
  filters: FertilizerQuery;
  fetchApplications: () => Promise<void>;
  getApplicationById: (id: string) => Promise<FertilizerApplication | null>;
  addApplication: (data: Omit<FertilizerApplication, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FertilizerApplication>;
  updateApplication: (id: string, data: Partial<Omit<FertilizerApplication, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<FertilizerApplication>;
  deleteApplication: (id: string) => Promise<void>;
  completeApplication: (id: string, completedDate: string) => Promise<FertilizerApplication>;
  setSelectedApplication: (app: FertilizerApplication | null) => void;
  setFilters: (filters: Partial<FertilizerQuery>) => void;
  clearFilters: () => void;
  clearError: () => void;
}

const fertilizerRepository = new FertilizerRepository();

export const useFertilizerStore = create<FertilizerState>((set, get) => ({
  applications: { data: [], isLoading: false, error: null },
  selectedApplication: null,
  filters: {},

  fetchApplications: async () => {
    set((state) => ({ applications: { ...state.applications, isLoading: true, error: null } }));
    try {
      const data = await fertilizerRepository.getAll(get().filters);
      set({ applications: { data, isLoading: false, error: null } });
    } catch (error) {
      set({ applications: { data: [], isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch' } });
    }
  },

  getApplicationById: async (id) => {
    try { return await fertilizerRepository.getById(id); } catch { return null; }
  },

  addApplication: async (data) => {
    try {
      const newApp = await fertilizerRepository.create(data);
      set((state) => ({ applications: { ...state.applications, data: [...state.applications.data, newApp] } }));
      return newApp;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add';
      set((state) => ({ applications: { ...state.applications, error: message } }));
      throw error;
    }
  },

  updateApplication: async (id, data) => {
    try {
      const updated = await fertilizerRepository.update(id, data);
      set((state) => ({
        applications: { ...state.applications, data: state.applications.data.map((a) => (a.id === id ? updated : a)) },
      }));
      if (get().selectedApplication?.id === id) set({ selectedApplication: updated });
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update';
      set((state) => ({ applications: { ...state.applications, error: message } }));
      throw error;
    }
  },

  deleteApplication: async (id) => {
    try {
      await fertilizerRepository.delete(id);
      set((state) => ({ applications: { ...state.applications, data: state.applications.data.filter((a) => a.id !== id) } }));
      if (get().selectedApplication?.id === id) set({ selectedApplication: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete';
      set((state) => ({ applications: { ...state.applications, error: message } }));
      throw error;
    }
  },

  completeApplication: async (id, completedDate) => {
    try {
      const updated = await fertilizerRepository.update(id, { completedDate, status: 'completed' });
      set((state) => ({
        applications: { ...state.applications, data: state.applications.data.map((a) => (a.id === id ? updated : a)) },
      }));
      if (get().selectedApplication?.id === id) set({ selectedApplication: updated });
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete';
      set((state) => ({ applications: { ...state.applications, error: message } }));
      throw error;
    }
  },

  setSelectedApplication: (app) => set({ selectedApplication: app }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),
  clearError: () => set((state) => ({ applications: { ...state.applications, error: null } })),
}));