import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { WeatherRecord, AppSettings, DEFAULT_SETTINGS, SyncState, SyncQueueItem } from '../types';
import { WeatherRepository } from '../features/weather/repository/weatherRepository';
import { SettingsRepository } from '../features/backup/repository/settingsRepository';

interface AppUIState {
  settings: AppSettings;
  isOnline: boolean;
  sync: SyncState;
  syncQueue: SyncQueueItem[];
  weather: {
    current: WeatherRecord | null;
    forecast: WeatherRecord[];
    lastSync: string | null;
    isLoading: boolean;
    error: string | null;
  };
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;
  setOnlineStatus: (online: boolean) => void;
  fetchWeather: () => Promise<void>;
  addSyncQueueItem: (item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSyncStatus: (status: Partial<SyncState>) => void;
  clearWeatherError: () => void;
}

const weatherRepository = new WeatherRepository();
const settingsRepository = new SettingsRepository();

export const useAppStore = create<AppUIState>()(
  subscribeWithSelector((set, get) => ({
    settings: DEFAULT_SETTINGS,
    isOnline: true,
    sync: { lastSyncAt: null, isSyncing: false, pendingCount: 0, failedCount: 0 },
    syncQueue: [],
    weather: { current: null, forecast: [], lastSync: null, isLoading: false, error: null },

    loadSettings: async () => {
      try {
        const settings = await settingsRepository.getSettings();
        set({ settings });
      } catch {
        set({ settings: DEFAULT_SETTINGS });
      }
    },

    updateSettings: async (partial) => {
      const newSettings = { ...get().settings, ...partial };
      set({ settings: newSettings });
      try {
        await settingsRepository.saveSettings(newSettings);
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    },

    setOnlineStatus: (online) => set({ isOnline: online }),

    fetchWeather: async () => {
      set((state) => ({ weather: { ...state.weather, isLoading: true, error: null } }));
      try {
        const { current, forecast, lastSync } = await weatherRepository.getWeatherData();
        set({ weather: { current, forecast, lastSync, isLoading: false, error: null } });
      } catch (error) {
        set((state) => ({ weather: { ...state.weather, isLoading: false, error: error instanceof Error ? error.message : 'Failed to fetch weather' } }));
      }
    },

    addSyncQueueItem: async (item) => {
      const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const queueItem: SyncQueueItem = { ...item, id, createdAt: now, updatedAt: now };
      set((state) => ({ syncQueue: [...state.syncQueue, queueItem] }));
    },

    updateSyncStatus: (status) =>
      set((state) => ({ sync: { ...state.sync, ...status } })),

    clearWeatherError: () =>
      set((state) => ({ weather: { ...state.weather, error: null } })),
  }))
);
