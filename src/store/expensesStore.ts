import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Expense, ExpenseQuery, AsyncState } from '../types';
import { ExpenseRepository } from '../features/expenses/repository/expenseRepository';

interface ExpensesState {
  expenses: AsyncState<Expense[]>;
  selectedExpense: Expense | null;
  filters: ExpenseQuery;
  fetchExpenses: () => Promise<void>;
  getExpenseById: (id: string) => Promise<Expense | null>;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  setSelectedExpense: (expense: Expense | null) => void;
  setFilters: (filters: Partial<ExpenseQuery>) => void;
  clearFilters: () => void;
  clearError: () => void;
}

const expenseRepository = new ExpenseRepository();

export const useExpensesStore = create<ExpensesState>()(
  subscribeWithSelector((set, get) => ({
    expenses: { data: [], isLoading: false, error: null },
    selectedExpense: null,
    filters: {},

    fetchExpenses: async () => {
      set((state) => ({ expenses: { ...state.expenses, isLoading: true, error: null } }));
      try {
        const data = await expenseRepository.getAll(get().filters);
        set({ expenses: { data, isLoading: false, error: null } });
      } catch (error) {
        set({ expenses: { data: [], isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch expenses' } });
      }
    },

    getExpenseById: async (id) => {
      try {
        return await expenseRepository.getById(id);
      } catch {
        return null;
      }
    },

    addExpense: async (expenseData) => {
      try {
        const newExpense = await expenseRepository.create(expenseData);
        set((state) => ({ expenses: { ...state.expenses, data: [...state.expenses.data, newExpense] } }));
        return newExpense;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add expense';
        set((state) => ({ expenses: { ...state.expenses, error: message } }));
        throw error;
      }
    },

    updateExpense: async (id, data) => {
      try {
        const updated = await expenseRepository.update(id, data);
        set((state) => ({
          expenses: { ...state.expenses, data: state.expenses.data.map((e) => (e.id === id ? updated : e)) },
        }));
        if (get().selectedExpense?.id === id) set({ selectedExpense: updated });
        return updated;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update expense';
        set((state) => ({ expenses: { ...state.expenses, error: message } }));
        throw error;
      }
    },

    deleteExpense: async (id) => {
      try {
        await expenseRepository.delete(id);
        set((state) => ({ expenses: { ...state.expenses, data: state.expenses.data.filter((e) => e.id !== id) } }));
        if (get().selectedExpense?.id === id) set({ selectedExpense: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete expense';
        set((state) => ({ expenses: { ...state.expenses, error: message } }));
        throw error;
      }
    },

    setSelectedExpense: (expense) => set({ selectedExpense: expense }),
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    clearFilters: () => set({ filters: {} }),
    clearError: () => set((state) => ({ expenses: { ...state.expenses, error: null } })),
  }))
);
