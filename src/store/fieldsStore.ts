import { create } from 'zustand';
import { Field, FieldQuery, AsyncState } from '../types';
import { FieldRepository } from '../features/fields/repository/fieldRepository';

interface FieldState {
  fields: AsyncState<Field[]>;
  selectedField: Field | null;
  filters: FieldQuery;
  fetchFields: () => Promise<void>;
  getFieldById: (id: string) => Promise<Field | null>;
  addField: (data: Omit<Field, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Field>;
  updateField: (id: string, data: Partial<Omit<Field, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Field>;
  deleteField: (id: string) => Promise<void>;
  setSelectedField: (field: Field | null) => void;
  setFilters: (filters: Partial<FieldQuery>) => void;
  clearError: () => void;
}

const fieldRepository = new FieldRepository();

export const useFieldsStore = create<FieldState>((set, get) => ({
  fields: { data: [], isLoading: false, error: null },
  selectedField: null,
  filters: {},

  fetchFields: async () => {
    set((state) => ({ fields: { ...state.fields, isLoading: true, error: null } }));
    try {
      const data = await fieldRepository.getAll(get().filters);
      set({ fields: { data, isLoading: false, error: null } });
    } catch (error) {
      set({ fields: { data: [], isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch fields' } });
    }
  },

  getFieldById: async (id) => {
    try { return await fieldRepository.getById(id); } catch { return null; }
  },

  addField: async (data) => {
    try {
      const newField = await fieldRepository.create(data);
      set((state) => ({ fields: { ...state.fields, data: [...state.fields.data, newField] } }));
      return newField;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add field';
      set((state) => ({ fields: { ...state.fields, error: message } }));
      throw error;
    }
  },

  updateField: async (id, data) => {
    try {
      const updated = await fieldRepository.update(id, data);
      set((state) => ({
        fields: { ...state.fields, data: state.fields.data.map((f) => (f.id === id ? updated : f)) },
      }));
      if (get().selectedField?.id === id) set({ selectedField: updated });
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update field';
      set((state) => ({ fields: { ...state.fields, error: message } }));
      throw error;
    }
  },

  deleteField: async (id) => {
    try {
      await fieldRepository.delete(id);
      set((state) => ({ fields: { ...state.fields, data: state.fields.data.filter((f) => f.id !== id) } }));
      if (get().selectedField?.id === id) set({ selectedField: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete field';
      set((state) => ({ fields: { ...state.fields, error: message } }));
      throw error;
    }
  },

  setSelectedField: (field) => set({ selectedField: field }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearError: () => set((state) => ({ fields: { ...state.fields, error: null } })),
}));
