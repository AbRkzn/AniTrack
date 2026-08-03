import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCropsStore } from '../../store/cropsStore';
import { useExpensesStore } from '../../store/expensesStore';
import { useHarvestsStore } from '../../store/harvestsStore';
import { useAppStore } from '../../store/appStore';
import { StatCard } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { OfflineBadge } from '../../components/ui/StatusBadge';
import { Icon, IconName } from '../../components/ui/Icon';
import { typography, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { formatCurrency, withAlpha } from '../../utils/helpers';

function QuickAction({ icon, label, color, onPress }: { icon: IconName; label: string; color: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.actionItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIconTile, { backgroundColor: withAlpha(color, 0.12) }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActivityIcon({ icon, color }: { icon: IconName; color: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.activityIconTile, { backgroundColor: withAlpha(color, 0.12) }]}>
      <Icon name={icon} size={18} color={color} />
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const crops = useCropsStore((s) => s.crops.data);
  const expenses = useExpensesStore((s) => s.expenses.data);
  const harvests = useHarvestsStore((s) => s.harvests.data);
  const isOnline = useAppStore((s) => s.isOnline);
  const settings = useAppStore((s) => s.settings);

  const fetchCrops = useCropsStore((s) => s.fetchCrops);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);
  const fetchHarvests = useHarvestsStore((s) => s.fetchHarvests);

  useFocusEffect(
    useCallback(() => {
      fetchCrops();
      fetchExpenses();
      fetchHarvests();
    }, [fetchCrops, fetchExpenses, fetchHarvests])
  );

  const activeCrops = crops.filter((c) => c.status === 'growing').length;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = harvests.reduce((sum, h) => sum + (h.revenue || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="AniTrack"
        subtitle="Farm Management"
        rightComponent={<OfflineBadge isOnline={isOnline} />}
        rightAction={{ icon: 'stats-chart', onPress: () => router.push('/reports') }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <StatCard title="Active Crops" value={activeCrops} icon="leaf" style={styles.statHalf} />
          <StatCard title="Total Harvests" value={harvests.length} icon="basket" style={styles.statHalf} />
          <StatCard title="Monthly Expenses" value={formatCurrency(totalExpenses, settings.currency)} icon="cash-outline" color={colors.error} style={styles.statHalf} />
          <StatCard title="Revenue" value={formatCurrency(totalRevenue, settings.currency)} icon="trending-up" color={colors.primary} style={styles.statHalf} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickAction icon="leaf" label="Add Crop" color={colors.primary} onPress={() => router.push('/crop-form')} />
            <QuickAction icon="basket" label="Add Harvest" color={colors.warning} onPress={() => router.push('/harvest-form')} />
            <QuickAction icon="wallet" label="Add Expense" color={colors.error} onPress={() => router.push('/expense-form')} />
            <QuickAction icon="flask" label="Fertilizer" color={colors.chartPurple} onPress={() => router.push('/fertilizers')} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {crops.length === 0 && expenses.length === 0 && harvests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconTile, { backgroundColor: colors.primaryFaded }]}>
                <Icon name="reader-outline" size={30} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Activities Yet</Text>
              <Text style={styles.emptyText}>Start by adding your first crop, harvest, or expense.</Text>
            </View>
          ) : (
            <View>
              {crops.slice(0, 3).map((crop) => (
                <View key={crop.id} style={styles.activityItem}>
                  <ActivityIcon icon="leaf" color={colors.primary} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Crop: {crop.name}</Text>
                    <Text style={styles.activitySubtitle}>{crop.variety} - {crop.status.replace(/_/g, ' ')}</Text>
                  </View>
                </View>
              ))}
              {harvests.slice(0, 3).map((harvest) => (
                <View key={harvest.id} style={styles.activityItem}>
                  <ActivityIcon icon="basket" color={colors.warning} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Harvest: {harvest.quantity} {harvest.unit}</Text>
                    <Text style={styles.activitySubtitle}>{harvest.harvestDate}</Text>
                  </View>
                </View>
              ))}
              {expenses.slice(0, 3).map((expense) => (
                <View key={expense.id} style={styles.activityItem}>
                  <ActivityIcon icon="cash" color={colors.error} />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>Expense: {formatCurrency(expense.amount, settings.currency)}</Text>
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

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
    statHalf: { minWidth: 160, flexGrow: 1 },
    section: { marginBottom: spacing.xl },
    sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.md },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    actionItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 150,
      flexGrow: 1,
    },
    actionIconTile: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionLabel: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary },
    emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxxl },
    emptyIconTile: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    emptyTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
    emptyText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.sm,
      gap: spacing.md,
    },
    activityIconTile: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    activityContent: { flex: 1 },
    activityTitle: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary },
    activitySubtitle: { ...typography.caption, color: colors.textSecondary },
  });
