import { useEffect, useState, useCallback } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

import { getDatabase } from "@database/connection";
import { runMigrations } from "@database/migrations";
import { useThemeStore } from "@store/useThemeStore";

SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op: splash may already be hidden in dev reload */
});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const resolvedScheme = useThemeStore((s) => s.resolvedScheme);
  const colors = useThemeStore((s) => s.colors);

  useEffect(() => {
    async function bootstrap() {
      try {
        const db = await getDatabase();
        await runMigrations(db);
        await hydrateTheme();
      } catch (err) {
        // Surface DB init failures loudly — the whole app is offline-first
        // and unusable if SQLite fails to open.
        console.error("[AniTrack] Failed to initialize database:", err);
      } finally {
        setIsReady(true);
      }
    }
    bootstrap();
  }, [hydrateTheme]);

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayoutRootView}>
          <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
