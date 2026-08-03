import { create } from 'zustand';
import { Animal, AnimalQuery, AsyncState } from '../types';
import { AnimalRepository } from '../features/animals/repository/animalRepository';

interface AnimalsState {
  animals: AsyncState<Animal[]>;
  selectedAnimal: Animal | null;
  filters: AnimalQuery;
  fetchAnimals: () => Promise<void>;
  getAnimalById: (id: string) => Promise<Animal | null>;
  addAnimal: (animal: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Animal>;
  updateAnimal: (id: string, data: Partial<Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Animal>;
  deleteAnimal: (id: string) => Promise<void>;
  setSelectedAnimal: (animal: Animal | null) => void;
  setFilters: (filters: Partial<AnimalQuery>) => void;
  clearFilters: () => void;
  clearError: () => void;
}

const animalRepository = new AnimalRepository();

export const useAnimalsStore = create<AnimalsState>((set, get) => ({
  animals: { data: [], isLoading: false, error: null },
  selectedAnimal: null,
  filters: {},

  fetchAnimals: async () => {
    set((state) => ({ animals: { ...state.animals, isLoading: true, error: null } }));
    try {
      const data = await animalRepository.getAll(get().filters);
      set({ animals: { data, isLoading: false, error: null } });
    } catch (error) {
      set({ animals: { data: [], isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch animals' } });
    }
  },

  getAnimalById: async (id) => {
    try { return await animalRepository.getById(id); } catch { return null; }
  },

  addAnimal: async (animalData) => {
    try {
      const newAnimal = await animalRepository.create(animalData);
      set((state) => ({ animals: { ...state.animals, data: [...state.animals.data, newAnimal] } }));
      return newAnimal;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add animal';
      set((state) => ({ animals: { ...state.animals, error: message } }));
      throw error;
    }
  },

  updateAnimal: async (id, data) => {
    try {
      const updatedAnimal = await animalRepository.update(id, data);
      set((state) => ({
        animals: { ...state.animals, data: state.animals.data.map((a) => (a.id === id ? updatedAnimal : a)) },
      }));
      if (get().selectedAnimal?.id === id) set({ selectedAnimal: updatedAnimal });
      return updatedAnimal;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update animal';
      set((state) => ({ animals: { ...state.animals, error: message } }));
      throw error;
    }
  },

  deleteAnimal: async (id) => {
    try {
      await animalRepository.delete(id);
      set((state) => ({ animals: { ...state.animals, data: state.animals.data.filter((a) => a.id !== id) } }));
      if (get().selectedAnimal?.id === id) set({ selectedAnimal: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete animal';
      set((state) => ({ animals: { ...state.animals, error: message } }));
      throw error;
    }
  },

  setSelectedAnimal: (animal) => set({ selectedAnimal: animal }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),
  clearError: () => set((state) => ({ animals: { ...state.animals, error: null } })),
}));
