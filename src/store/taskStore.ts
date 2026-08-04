import { create } from 'zustand';
import { FarmTask, TaskQuery, AsyncState } from '../types';
import { TaskRepository } from '../features/tasks/repository/taskRepository';

interface TaskState {
  tasks: AsyncState<FarmTask[]>;
  selectedTask: FarmTask | null;
  filters: TaskQuery;
  fetchTasks: () => Promise<void>;
  getTaskById: (id: string) => Promise<FarmTask | null>;
  addTask: (data: Omit<FarmTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FarmTask>;
  updateTask: (id: string, data: Partial<Omit<FarmTask, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<FarmTask>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string, status: FarmTask['status']) => Promise<FarmTask>;
  setSelectedTask: (task: FarmTask | null) => void;
  setFilters: (filters: Partial<TaskQuery>) => void;
  clearFilters: () => void;
  clearError: () => void;
}

const taskRepository = new TaskRepository();

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: { data: [], isLoading: false, error: null },
  selectedTask: null,
  filters: {},

  fetchTasks: async () => {
    set((state) => ({ tasks: { ...state.tasks, isLoading: true, error: null } }));
    try {
      const data = await taskRepository.getAll(get().filters);
      set({ tasks: { data, isLoading: false, error: null } });
    } catch (error) {
      set({ tasks: { data: [], isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch tasks' } });
    }
  },

  getTaskById: async (id) => {
    try { return await taskRepository.getById(id); } catch { return null; }
  },

  addTask: async (data) => {
    try {
      const newTask = await taskRepository.create(data);
      set((state) => ({ tasks: { ...state.tasks, data: [...state.tasks.data, newTask] } }));
      return newTask;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add task';
      set((state) => ({ tasks: { ...state.tasks, error: message } }));
      throw error;
    }
  },

  updateTask: async (id, data) => {
    try {
      const updated = await taskRepository.update(id, data);
      set((state) => ({
        tasks: { ...state.tasks, data: state.tasks.data.map((t) => (t.id === id ? updated : t)) },
      }));
      if (get().selectedTask?.id === id) set({ selectedTask: updated });
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update task';
      set((state) => ({ tasks: { ...state.tasks, error: message } }));
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      await taskRepository.delete(id);
      set((state) => ({ tasks: { ...state.tasks, data: state.tasks.data.filter((t) => t.id !== id) } }));
      if (get().selectedTask?.id === id) set({ selectedTask: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete task';
      set((state) => ({ tasks: { ...state.tasks, error: message } }));
      throw error;
    }
  },

  toggleTaskStatus: async (id, status) => {
    const completedDate = status === 'completed' ? new Date().toISOString().split('T')[0] : '';
    const updated = await taskRepository.update(id, { status, completedDate });
    set((state) => ({
      tasks: { ...state.tasks, data: state.tasks.data.map((t) => (t.id === id ? updated : t)) },
    }));
    if (get().selectedTask?.id === id) set({ selectedTask: updated });
    return updated;
  },

  setSelectedTask: (task) => set({ selectedTask: task }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),
  clearError: () => set((state) => ({ tasks: { ...state.tasks, error: null } })),
}));
