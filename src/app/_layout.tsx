import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { seedIfEmpty } from '../database/seed';
import { useAppStore } from '../store/appStore';
import { ThemeProvider, useTheme } from '../constants/themeContext';
import { configureNotifications, setupNotificationTapHandling } from '../services/notifications';
import { useWeatherSync } from '../hooks/useWeatherSync';

function RootNavigator({ ready }: { ready: boolean }) {
  const { colors, isDark } = useTheme();

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="crop-form" options={{ presentation: 'modal' }} />
        <Stack.Screen name="harvest-form" options={{ presentation: 'modal' }} />
        <Stack.Screen name="expense-form" options={{ presentation: 'modal' }} />
        <Stack.Screen name="fertilizer-form" options={{ presentation: 'modal' }} />
        <Stack.Screen name="animal-form" options={{ presentation: 'modal' }} />
        <Stack.Screen name="health-record-form" options={{ presentation: 'modal' }} />
        <Stack.Screen name="export" options={{ presentation: 'modal' }} />
        <Stack.Screen name="task-form" options={{ presentation: 'modal' }} />
        <Stack.Screen name="budget-form" options={{ presentation: 'modal' }} />
        <Stack.Screen name="field-form" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const loadSettings = useAppStore((s) => s.loadSettings);
  useWeatherSync(ready);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    configureNotifications().catch(() => {});
    setupNotificationTapHandling(
      () => router.push('/crops'),
      () => router.push('/tasks')
    )
      .then((fn) => {
        unsubscribe = fn;
      })
      .catch(() => {});
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    Promise.all([seedIfEmpty(), loadSettings()]).finally(() => setReady(true));
  }, [loadSettings]);

  return (
    <ThemeProvider>
      <RootNavigator ready={ready} />
    </ThemeProvider>
  );
}
