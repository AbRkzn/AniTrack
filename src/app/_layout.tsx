import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore } from '../store/appStore';
import { useCropsStore } from '../store/cropsStore';
import { useExpensesStore } from '../store/expensesStore';
import { useHarvestsStore } from '../store/harvestsStore';
import { useFertilizerStore } from '../store/fertilizerStore';
import { getDatabase } from '../database';
import { runMigrations } from '../database/migrations';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const loadSettings = useAppStore((s: any) => s.loadSettings);
  const fetchCrops = useCropsStore((s: any) => s.fetchCrops);
  const fetchExpenses = useExpensesStore((s: any) => s.fetchExpenses);
  const fetchHarvests = useHarvestsStore((s: any) => s.fetchHarvests);
  const fetchApplications = useFertilizerStore((s: any) => s.fetchApplications);

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        await runMigrations();
        await loadSettings();
        await Promise.all([
          fetchCrops(),
          fetchExpenses(),
          fetchHarvests(),
          fetchApplications(),
        ]);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    }
    init();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.light.background },
        }}
      />
    </SafeAreaProvider>
  );
}