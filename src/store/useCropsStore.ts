import { create } from "zustand";
import { Crop } from "@/types/models";
import {
  cropsRepository,
  CreateCropInput,
  UpdateCropInput,
} from "@database/repositories/cropsRepository";

interface CropsState {
  crops: Crop[];
  isLoading: boolean;
  error: string | null;

  loadCrops: () => Promise<void>;
  addCrop: (input: CreateCropInput) => Promise<Crop>;
  updateCrop: (id: string, input: UpdateCropInput) => Promise<void>;
  deleteCrop: (id: string) => Promise<void>;
}

export const useCropsStore = create<CropsState>((set, get) => ({
  crops: [],
  isLoading: false,
  error: null,

  loadCrops: async () => {
    set({ isLoading: true, error: null });
    try {
      const crops = await cropsRepository.findAll();
      set({ crops, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load crops",
        isLoading: false,
      });
    }
  },

  addCrop: async (input) => {
    const crop = await cropsRepository.create(input);
    set({ crops: [crop, ...get().crops] });
    return crop;
  },

  updateCrop: async (id, input) => {
    const updated = await cropsRepository.update(id, input);
    set({
      crops: get().crops.map((c) => (c.id === id ? updated : c)),
    });
  },

  deleteCrop: async (id) => {
    await cropsRepository.delete(id);
    set({ crops: get().crops.filter((c) => c.id !== id) });
  },
}));
