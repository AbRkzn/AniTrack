import { create } from 'zustand';
import { Budget, BudgetQuery, AsyncState } from '../types';
import { BudgetRepository } from '../features/budgets/repository/budgetRepository';

interface BudgetState {
  budgets: AsyncState<Budget[]>;
  selectedBudget: Budget | null;
  filters: BudgetQuery;
  fetchBudgets: () => Promise<void>;
  getBudgetById: (id: string) => Promise<Budget | null>;
  addBudget: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Budget>;
  updateBudget: (id: string, data: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;
  setSelectedBudget: (budget: Budget | null) => void;
  setFilters: (filters: Partial<BudgetQuery>) => void;
  clearFilters: () => void;
  clearError: () => void;
}

const budgetRepository = new BudgetRepository();

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: { data: [], isLoading: false, error: null },
  selectedBudget: null,
  filters: {},

  fetchBudgets: async () => {
    set((state) => ({ budgets: { ...state.budgets, isLoading: true, error: null } }));
    try {
      const data = await budgetRepository.getAll(get().filters);
      set({ budgets: { data, isLoading: false, error: null } });
    } catch (error) {
      set({ budgets: { data: [], isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch budgets' } });
    }
  },

  getBudgetById: async (id) => {
    try { return await budgetRepository.getById(id); } catch { return null; }
  },

  addBudget: async (data) => {
    try {
      const newBudget = await budgetRepository.create(data);
      const exists = get().budgets.data.some((b) => b.id === newBudget.id);
      set((state) => ({
        budgets: {
          ...state.budgets,
          data: exists ? state.budgets.data.map((b) => (b.id === newBudget.id ? newBudget : b)) : [...state.budgets.data, newBudget],
        },
      }));
      return newBudget;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add budget';
      set((state) => ({ budgets: { ...state.budgets, error: message } }));
      throw error;
    }
  },

  updateBudget: async (id, data) => {
    try {
      const updated = await budgetRepository.update(id, data);
      set((state) => ({
        budgets: { ...state.budgets, data: state.budgets.data.map((b) => (b.id === id ? updated : b)) },
      }));
      if (get().selectedBudget?.id === id) set({ selectedBudget: updated });
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update budget';
      set((state) => ({ budgets: { ...state.budgets, error: message } }));
      throw error;
    }
  },

  deleteBudget: async (id) => {
    try {
      await budgetRepository.delete(id);
      set((state) => ({ budgets: { ...state.budgets, data: state.budgets.data.filter((b) => b.id !== id) } }));
      if (get().selectedBudget?.id === id) set({ selectedBudget: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete budget';
      set((state) => ({ budgets: { ...state.budgets, error: message } }));
      throw error;
    }
  },

  setSelectedBudget: (budget) => set({ selectedBudget: budget }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),
  clearError: () => set((state) => ({ budgets: { ...state.budgets, error: null } })),
}));
