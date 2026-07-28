import { create } from 'zustand';
import { Harvest, HarvestQuery, AsyncState } from '../types';
import { HarvestRepository } from '../features/harvests/repository/harvestRepository';

interface HarvestsState {
  harvests: AsyncState<Harvest[]>;
  selectedHarvest: Harvest | null;
  filters: HarvestQuery;
  fetchHarvests: () => Promise<void>;
  getHarvestById: (id: string) => Promise<Harvest | null>;
  addHarvest: (data: Omit<Harvest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Harvest>;
  updateHarvest: (id: string, data: Partial<Omit<Harvest, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Harvest>;
  deleteHarvest: (id: string) => Promise<void>;
  setSelectedHarvest: (h: Harvest | null) => void;
  setFilters: (filters: Partial<HarvestQuery>) => void;
  clearFilters: () => void;
  clearError: () => void;
}

const harvestRepository = new HarvestRepository();

export const useHarvestsStore = create<HarvestsState>((set, get) => ({
  harvests: { data: [], isLoading: false, error: null },
  selectedHarvest: null,
  filters: {},

  fetchHarvests: async () => {
    set((state) => ({ harvests: { ...state.harvests, isLoading: true, error: null } }));
    try {
      const data = await harvestRepository.getAll(get().filters);
      set({ harvests: { data, isLoading: false, error: null } });
    } catch (error) {
      set({ harvests: { data: [], isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch' } });
    }
  },

  getHarvestById: async (id) => {
    try { return await harvestRepository.getById(id); } catch { return null; }
  },

  addHarvest: async (data) => {
    try {
      const newHarvest = await harvestRepository.create(data);
      set((state) => ({ harvests: { ...state.harvests, data: [...state.harvests.data, newHarvest] } }));
      return newHarvest;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add';
      set((state) => ({ harvests: { ...state.harvests, error: message } }));
      throw error;
    }
  },

  updateHarvest: async (id, data) => {
    try {
      const updated = await harvestRepository.update(id, data);
      set((state) => ({
        harvests: { ...state.harvests, data: state.harvests.data.map((h) => (h.id === id ? updated : h)) },
      }));
      if (get().selectedHarvest?.id === id) set({ selectedHarvest: updated });
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update';
      set((state) => ({ harvests: { ...state.harvests, error: message } }));
      throw error;
    }
  },

  deleteHarvest: async (id) => {
    try {
      await harvestRepository.delete(id);
      set((state) => ({ harvests: { ...state.harvests, data: state.harvests.data.filter((h) => h.id !== id) } }));
      if (get().selectedHarvest?.id === id) set({ selectedHarvest: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete';
      set((state) => ({ harvests: { ...state.harvests, error: message } }));
      throw error;
    }
  },

  setSelectedHarvest: (h) => set({ selectedHarvest: h }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),
  clearError: () => set((state) => ({ harvests: { ...state.harvests, error: null } })),
}));