import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Crop, CropStatus, CropQuery, AsyncState } from '../types';
import { CropRepository } from '../features/crops/repository/cropRepository';

interface CropsState {
  crops: AsyncState<Crop[]>;
  selectedCrop: Crop | null;
  filters: CropQuery;
  fetchCrops: () => Promise<void>;
  getCropById: (id: string) => Promise<Crop | null>;
  addCrop: (crop: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Crop>;
  updateCrop: (id: string, data: Partial<Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Crop>;
  deleteCrop: (id: string) => Promise<void>;
  setSelectedCrop: (crop: Crop | null) => void;
  setFilters: (filters: Partial<CropQuery>) => void;
  clearFilters: () => void;
  clearError: () => void;
}

const cropRepository = new CropRepository();

export const useCropsStore = create<CropsState>()(
  subscribeWithSelector((set, get) => ({
    crops: { data: [], isLoading: false, error: null },
    selectedCrop: null,
    filters: {},

    fetchCrops: async () => {
      set((state) => ({
        crops: { ...state.crops, isLoading: true, error: null },
      }));
      try {
        const data = await cropRepository.getAll(get().filters);
        set({ crops: { data, isLoading: false, error: null } });
      } catch (error) {
        set({ crops: { data: [], isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch crops' } });
      }
    },

    getCropById: async (id: string) => {
      try {
        return await cropRepository.getById(id);
      } catch (error) {
        console.error('Error fetching crop:', error);
        return null;
      }
    },

    addCrop: async (cropData) => {
      try {
        const newCrop = await cropRepository.create(cropData);
        set((state) => ({
          crops: { ...state.crops, data: [...state.crops.data, newCrop] },
        }));
        return newCrop;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add crop';
        set((state) => ({
          crops: { ...state.crops, error: message },
        }));
        throw error;
      }
    },

    updateCrop: async (id, data) => {
      try {
        const updatedCrop = await cropRepository.update(id, data);
        set((state) => ({
          crops: {
            ...state.crops,
            data: state.crops.data.map((c) => (c.id === id ? updatedCrop : c)),
          },
        }));
        if (get().selectedCrop?.id === id) {
          set({ selectedCrop: updatedCrop });
        }
        return updatedCrop;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update crop';
        set((state) => ({
          crops: { ...state.crops, error: message },
        }));
        throw error;
      }
    },

    deleteCrop: async (id) => {
      try {
        await cropRepository.delete(id);
        set((state) => ({
          crops: {
            ...state.crops,
            data: state.crops.data.filter((c) => c.id !== id),
          },
        }));
        if (get().selectedCrop?.id === id) {
          set({ selectedCrop: null });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete crop';
        set((state) => ({
          crops: { ...state.crops, error: message },
        }));
        throw error;
      }
    },

    setSelectedCrop: (crop) => set({ selectedCrop: crop }),

    setFilters: (filters) =>
      set((state) => ({
        filters: { ...state.filters, ...filters },
      })),

    clearFilters: () => set({ filters: {} }),

    clearError: () =>
      set((state) => ({
        crops: { ...state.crops, error: null },
      })),
  }))
);
