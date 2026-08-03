import React, { useCallback, useMemo, ComponentProps } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useCropsStore } from '../store/cropsStore';
import { useHarvestsStore } from '../store/harvestsStore';
import { useExpensesStore } from '../store/expensesStore';
import { useAppStore } from '../store/appStore';
import { Header } from '../components/ui/Header';
import { Card, StatCard } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { formatCurrency, getCurrencySymbol } from '../utils/helpers';
import {
  groupExpensesByCategory,
  groupRevenueByMonth,
  groupExpensesByMonth,
  yieldComparison,
  getChartColor,
} from '../utils/reports';

const CHART_HEIGHT = 200;
const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - spacing.lg * 2;

interface ChartSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function ChartSection({ title, subtitle, children }: ChartSectionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      <Card padding={0} style={styles.chartCard}>
        {children}
      </Card>
    </View>
  );
}

function ChartEmpty({ message }: { message: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.chartEmpty}>
      <Text style={styles.chartEmptyText}>{message}</Text>
    </View>
  );
}

function LegendDot({ color }: { color: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <View style={[styles.legendDot, { backgroundColor: color }]} />;
}

export default function ReportsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const crops = useCropsStore((s) => s.crops.data);
  const harvests = useHarvestsStore((s) => s.harvests.data);
  const expenses = useExpensesStore((s) => s.expenses.data);
  const settings = useAppStore((s) => s.settings);
  const currencySymbol = getCurrencySymbol(settings.currency);

  const chartConfig = useMemo<NonNullable<ComponentProps<typeof LineChart>['chartConfig']>>(
    () => ({
      backgroundGradientFrom: colors.surface,
      backgroundGradientTo: colors.surface,
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
      propsForBackgroundLines: { stroke: colors.borderLight },
      propsForLabels: { fontSize: 11 },
      barPercentage: 0.7,
    }),
    [colors]
  );

  const fetchCrops = useCropsStore((s) => s.fetchCrops);
  const fetchHarvests = useHarvestsStore((s) => s.fetchHarvests);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);

  useFocusEffect(
    useCallback(() => {
      fetchCrops();
      fetchHarvests();
      fetchExpenses();
    }, [fetchCrops, fetchHarvests, fetchExpenses])
  );

  const totals = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRevenue = harvests.reduce((sum, h) => sum + (h.revenue || 0), 0);
    return { totalExpenses, totalRevenue, net: totalRevenue - totalExpenses };
  }, [expenses, harvests]);

  const expenseByCategory = useMemo(() => groupExpensesByCategory(expenses), [expenses]);
  const revenueByMonth = useMemo(() => groupRevenueByMonth(harvests), [harvests]);
  const expensesByMonth = useMemo(() => groupExpensesByMonth(expenses), [expenses]);
  const yieldData = useMemo(() => yieldComparison(crops, harvests), [crops, harvests]);

  const hasData = crops.length > 0 || harvests.length > 0 || expenses.length > 0;

  if (!hasData) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header
          title="AniTrack"
          subtitle="Reports & Analytics"
          leftAction={{ icon: 'arrow-back', onPress: () => router.back() }}
        />
        <EmptyState
          icon="stats-chart-outline"
          title="No Reports Yet"
          message="Add crops, harvests, and expenses to unlock analytics like expense breakdowns, revenue trends, and yield comparisons."
        />
      </SafeAreaView>
    );
  }

  const pieData = expenseByCategory.map((item, index) => ({
    name: item.label,
    population: item.value,
    color: getChartColor(index),
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="AniTrack"
        subtitle="Reports & Analytics"
        leftAction={{ icon: 'arrow-back', onPress: () => router.back() }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totals.totalRevenue, settings.currency)}
            icon="trending-up"
            color={colors.primary}
            style={styles.statHalf}
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(totals.totalExpenses, settings.currency)}
            icon="cash-outline"
            color={colors.error}
            style={styles.statHalf}
          />
          <StatCard
            title="Net Income"
            value={formatCurrency(totals.net, settings.currency)}
            icon="wallet"
            color={totals.net >= 0 ? colors.success : colors.error}
            style={styles.statHalf}
          />
          <StatCard
            title="Harvests"
            value={harvests.length}
            icon="basket-outline"
            style={styles.statHalf}
          />
        </View>

        <ChartSection
          title="Revenue Over Time"
          subtitle={`Monthly harvest revenue (${currencySymbol})`}
        >
          {revenueByMonth.length > 0 ? (
            <LineChart
              data={{
                labels: revenueByMonth.map((p) => p.label),
                datasets: [{ data: revenueByMonth.map((p) => p.value) }],
              }}
              width={chartWidth}
              height={CHART_HEIGHT}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
              }}
              bezier
              fromZero
              withDots
              withShadow={false}
              yAxisSuffix={currencySymbol}
            />
          ) : (
            <ChartEmpty message="No harvest revenue recorded yet." />
          )}
        </ChartSection>

        <ChartSection
          title="Expenses Over Time"
          subtitle={`Monthly expenses (${currencySymbol})`}
        >
          {expensesByMonth.length > 0 ? (
            <BarChart
              data={{
                labels: expensesByMonth.map((p) => p.label),
                datasets: [
                  {
                    data: expensesByMonth.map((p) => p.value),
                    color: (opacity = 1) => `rgba(217, 48, 48, ${opacity})`,
                  },
                ],
              }}
              width={chartWidth}
              height={CHART_HEIGHT}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(217, 48, 48, ${opacity})`,
              }}
              fromZero
              showValuesOnTopOfBars
              yAxisLabel=""
              yAxisSuffix={currencySymbol}
            />
          ) : (
            <ChartEmpty message="No expenses recorded yet." />
          )}
        </ChartSection>

        <ChartSection
          title="Expense Breakdown"
          subtitle={`By category · total ${formatCurrency(totals.totalExpenses, settings.currency)}`}
        >
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={chartWidth}
              height={180}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              hasLegend
            />
          ) : (
            <ChartEmpty message="No expense data yet." />
          )}
        </ChartSection>

        <ChartSection
          title="Yield vs Estimate"
          subtitle="Harvested quantity compared to the estimated yield"
        >
          {yieldData.labels.length > 0 ? (
            <View>
              <View style={styles.legendRow}>
                <LegendDot color={colors.primary} />
                <Text style={styles.legendText}>Actual</Text>
                <LegendDot color={colors.chartBlue} />
                <Text style={styles.legendText}>Estimate</Text>
              </View>
              <BarChart
                data={{
                  labels: yieldData.labels,
                  datasets: [
                    {
                      data: yieldData.actual,
                      color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                    },
                    {
                      data: yieldData.estimated,
                      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                    },
                  ],
                }}
                width={chartWidth}
                height={CHART_HEIGHT}
                chartConfig={chartConfig}
                fromZero
                showValuesOnTopOfBars
                yAxisLabel=""
                yAxisSuffix=""
              />
            </View>
          ) : (
            <ChartEmpty message="No harvested crops yet." />
          )}
        </ChartSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
    statHalf: { minWidth: 160, flexGrow: 1 },
    section: { marginBottom: spacing.xl },
    sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.xs },
    sectionSubtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
    chartCard: { overflow: 'hidden' },
    chartEmpty: {
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    chartEmptyText: { ...typography.bodySmall, color: colors.textTertiary, textAlign: 'center' },
    legendRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.xs, marginLeft: spacing.md },
    legendText: { ...typography.caption, color: colors.textSecondary, marginRight: spacing.sm },
  });
