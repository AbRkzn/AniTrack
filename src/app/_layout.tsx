import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { seedIfEmpty } from '../database/seed';
import { useAppStore } from '../store/appStore';
import { ThemeProvider, useTheme } from '../constants/themeContext';

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
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const loadSettings = useAppStore((s) => s.loadSettings);

  useEffect(() => {
    Promise.all([seedIfEmpty(), loadSettings()]).finally(() => setReady(true));
  }, [loadSettings]);

  return (
    <ThemeProvider>
      <RootNavigator ready={ready} />
    </ThemeProvider>
  );
}
