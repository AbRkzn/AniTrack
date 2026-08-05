import { create } from 'zustand';
import { AnimalProduct, AsyncState } from '../types';
import { AnimalProductRepository } from '../features/animals/repository/animalProductRepository';

interface AnimalProductState {
  products: AsyncState<AnimalProduct[]>;
  selectedProduct: AnimalProduct | null;
  fetchProducts: (animalId: string) => Promise<void>;
  fetchAllProducts: () => Promise<void>;
  getProductById: (id: string) => Promise<AnimalProduct | null>;
  addProduct: (data: Omit<AnimalProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<AnimalProduct>;
  updateProduct: (id: string, data: Partial<Omit<AnimalProduct, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<AnimalProduct>;
  deleteProduct: (id: string) => Promise<void>;
  setSelectedProduct: (product: AnimalProduct | null) => void;
  clearProducts: () => void;
  clearError: () => void;
}

const repository = new AnimalProductRepository();

export const useAnimalProductStore = create<AnimalProductState>((set, get) => ({
  products: { data: [], isLoading: false, error: null },
  selectedProduct: null,

  fetchProducts: async (animalId) => {
    set((state) => ({ products: { ...state.products, isLoading: true, error: null } }));
    try {
      const data = await repository.getByAnimalId(animalId);
      set({ products: { data, isLoading: false, error: null } });
    } catch (error) {
      set({ products: { data: [], isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch products' } });
    }
  },

  fetchAllProducts: async () => {
    set((state) => ({ products: { ...state.products, isLoading: true, error: null } }));
    try {
      const data = await repository.getAll();
      set({ products: { data, isLoading: false, error: null } });
    } catch (error) {
      set({ products: { data: [], isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch products' } });
    }
  },

  getProductById: async (id) => {
    try { return await repository.getById(id); } catch { return null; }
  },

  addProduct: async (data) => {
    try {
      const newProduct = await repository.create(data);
      set((state) => ({ products: { ...state.products, data: [newProduct, ...state.products.data] } }));
      return newProduct;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add product record';
      set((state) => ({ products: { ...state.products, error: message } }));
      throw error;
    }
  },

  updateProduct: async (id, data) => {
    try {
      const updatedProduct = await repository.update(id, data);
      set((state) => ({
        products: { ...state.products, data: state.products.data.map((p) => (p.id === id ? updatedProduct : p)) },
      }));
      if (get().selectedProduct?.id === id) set({ selectedProduct: updatedProduct });
      return updatedProduct;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update product record';
      set((state) => ({ products: { ...state.products, error: message } }));
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      await repository.delete(id);
      set((state) => ({ products: { ...state.products, data: state.products.data.filter((p) => p.id !== id) } }));
      if (get().selectedProduct?.id === id) set({ selectedProduct: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete product record';
      set((state) => ({ products: { ...state.products, error: message } }));
      throw error;
    }
  },

  setSelectedProduct: (product) => set({ selectedProduct: product }),
  clearProducts: () => set({ products: { data: [], isLoading: false, error: null } }),
  clearError: () => set((state) => ({ products: { ...state.products, error: null } })),
}));
