import { useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { useThemeStore } from "@store/useThemeStore";
import { useCropsStore } from "@store/useCropsStore";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { OfflineStatusBadge } from "@components/common/OfflineStatusBadge";
import { spacing, typography } from "@constants/theme";

export default function DashboardScreen() {
  const colors = useThemeStore((s) => s.colors);
  const { crops, loadCrops, isLoading } = useCropsStore();
  const router = useRouter();

  useEffect(() => {
    loadCrops();
  }, [loadCrops]);

  const activeCrops = crops.filter((c) => c.status === "growing" || c.status === "ready_for_harvest");
  const upcomingHarvests = crops.filter(
    (c) => c.expectedHarvestDate && new Date(c.expectedHarvestDate).getTime() - Date.now() < 14 * 86400000
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>AniTrack</Text>
        <OfflineStatusBadge />
      </View>

      {/* Hero Weather Card — populated in the Weather Sync phase */}
      <Card style={{ backgroundColor: colors.primary, marginBottom: spacing.lg }}>
        <Text style={[styles.weatherPlaceholder, { color: colors.textOnPrimary }]}>
          Weather sync arrives in Phase 6 — this card will show current
          conditions, a 3-day forecast, and last-sync time, all cached locally.
        </Text>
      </Card>

      <View style={styles.statsGrid}>
        <StatCard label="Active Crops" value={activeCrops.length} colorKey="primary" />
        <StatCard label="Upcoming Harvests" value={upcomingHarvests.length} colorKey="warning" />
        <StatCard label="Pending Fertilizer Tasks" value={0} colorKey="secondary" />
        <StatCard label="Monthly Expenses" value="₱0" colorKey="error" />
      </View>

      <View style={styles.quickActions}>
        <Button label="+ Add Crop" onPress={() => router.push("/crops")} fullWidth />
      </View>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
        {isLoading ? (
          <Text style={{ color: colors.textSecondary }}>Loading…</Text>
        ) : crops.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>
            No activity yet — add your first crop to get started.
          </Text>
        ) : (
          crops.slice(0, 5).map((c) => (
            <Text key={c.id} style={{ color: colors.textSecondary, marginBottom: spacing.xs }}>
              🌱 {c.name} added
            </Text>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  colorKey,
}: {
  label: string;
  value: string | number;
  colorKey: "primary" | "secondary" | "warning" | "error";
}) {
  const colors = useThemeStore((s) => s.colors);
  return (
    <Card style={styles.statCard}>
      <Text style={[styles.statValue, { color: colors[colorKey] }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: typography.heading1.fontSize,
    fontWeight: typography.heading1.fontWeight,
  },
  weatherPlaceholder: {
    fontSize: typography.bodySmall.fontSize,
    lineHeight: typography.bodySmall.lineHeight,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  statCard: {
    flexBasis: "47%",
  },
  statValue: {
    fontSize: typography.heading2.fontSize,
    fontWeight: typography.heading2.fontWeight,
  },
  statLabel: {
    fontSize: typography.bodySmall.fontSize,
    marginTop: spacing.xs,
  },
  quickActions: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.heading3.fontSize,
    fontWeight: typography.heading3.fontWeight,
    marginBottom: spacing.md,
  },
});
