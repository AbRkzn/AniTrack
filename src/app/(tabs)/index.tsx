import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCropsStore } from '../../store/cropsStore';
import { useExpensesStore } from '../../store/expensesStore';
import { useHarvestsStore } from '../../store/harvestsStore';
import { useFertilizerStore } from '../../store/fertilizerStore';
import { useAppStore } from '../../store/appStore';
import { StatCard } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { OfflineBadge } from '../../components/ui/StatusBadge';
import { colors, typography, spacing } from '../../constants/theme';
import { formatCurrency } from '../../utils/helpers';

export default function DashboardScreen() {
  const crops = useCropsStore((s) => s.crops.data);
  const expenses = useExpensesStore((s) => s.expenses.data);
  const harvests = useHarvestsStore((s) => s.harvests.data);
  const isOnline = useAppStore((s) => s.isOnline);

  const activeCrops = crops.filter((c) => c.status === 'growing').length;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = harvests.reduce((sum, h) => sum + (h.revenue || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="AniTrack"
        subtitle="Farm Management"
        rightComponent={<OfflineBadge isOnline={isOnline} />}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <StatCard title="Active Crops" value={activeCrops} icon="🌱" style={styles.statHalf} />
          <StatCard title="Total Harvests" value={harvests.length} icon="🌾" style={styles.statHalf} />
          <StatCard title="Monthly Expenses" value={formatCurrency(totalExpenses)} icon="💸" color={colors.light.error} style={styles.statHalf} />
          <StatCard title="Revenue" value={formatCurrency(totalRevenue)} icon="📈" color={colors.light.primary} style={styles.statHalf} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <View style={styles.actionItem}>
              <Text style={styles.actionIcon}>🌱</Text>
              <Text style={styles.actionLabel}>Add Crop</Text>
            </View>
            <View style={styles.actionItem}>
              <Text style={styles.actionIcon}>🌾</Text>
              <Text style={styles.actionLabel}>Add Harvest</Text>
            </View>
            <View style={styles.actionItem}>
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionLabel}>Add Expense</Text>
            </View>
            <View style={styles.actionItem}>
              <Text style={styles.actionIcon}>🧪</Text>
              <Text style={styles.actionLabel}>Add Task</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {crops.length === 0 && expenses.length === 0 && harvests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Activities Yet</Text>
              <Text style={styles.emptyText}>Start by adding your first crop, harvest, or expense.</Text>
            </View>
          ) : (
            <View>
              {crops.slice(0, 3).map((crop) => (
                <View key={crop.id} style={styles.activityItem}>
                  <Text style={styles.activityIcon}>🌱</Text>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Crop: {crop.name}</Text>
                    <Text style={styles.activitySubtitle}>{crop.variety} - {crop.status.replace(/_/g, ' ')}</Text>
                  </View>
                </View>
              ))}
              {harvests.slice(0, 3).map((harvest) => (
                <View key={harvest.id} style={styles.activityItem}>
                  <Text style={styles.activityIcon}>🌾</Text>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Harvest: {harvest.quantity} {harvest.unit}</Text>
                    <Text style={styles.activitySubtitle}>{harvest.harvestDate}</Text>
                  </View>
                </View>
              ))}
              {expenses.slice(0, 3).map((expense) => (
                <View key={expense.id} style={styles.activityItem}>
                  <Text style={styles.activityIcon}>💰</Text>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Expense: {formatCurrency(expense.amount)}</Text>
                    <Text style={styles.activitySubtitle}>{expense.category} - {expense.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.surface },
  container: { flex: 1, backgroundColor: colors.light.background },
  content: { padding: spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  statHalf: { minWidth: 160, flexGrow: 1 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.h4, color: colors.light.textPrimary, marginBottom: spacing.md },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  actionItem: {
    backgroundColor: colors.light.surface,
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    minWidth: 150,
    flexGrow: 1,
  },
  actionIcon: { fontSize: 32, marginBottom: spacing.sm },
  actionLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.light.textPrimary },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.h4, color: colors.light.textPrimary, marginBottom: spacing.sm },
  emptyText: { ...typography.bodySmall, color: colors.light.textSecondary, textAlign: 'center' },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  activityIcon: { fontSize: 24, marginRight: spacing.md },
  activityContent: { flex: 1 },
  activityTitle: { ...typography.bodySmall, fontWeight: '600', color: colors.light.textPrimary },
  activitySubtitle: { ...typography.caption, color: colors.light.textSecondary },
});