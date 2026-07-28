import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import * as Network from "expo-network";
import { useThemeStore } from "@store/useThemeStore";
import { radius, spacing, typography } from "@constants/theme";

/**
 * Shows whether the device currently has network connectivity.
 * AniTrack never blocks functionality on this — it's purely
 * informational, reinforcing the offline-first principle.
 */
export function OfflineStatusBadge() {
  const colors = useThemeStore((s) => s.colors);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const state = await Network.getNetworkStateAsync();
      if (mounted) setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    }

    check();
    const interval = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (isOnline === null) return null;

  const color = isOnline ? colors.success : colors.textSecondary;
  const label = isOnline ? "Online" : "Offline";

  return (
    <View style={[styles.container, { backgroundColor: `${color}1A` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.badge,
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
  },
});
