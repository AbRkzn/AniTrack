import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { format, addMonths } from 'date-fns';
import { useBudgetStore } from '../store/budgetStore';
import { useExpensesStore } from '../store/expensesStore';
import { useAppStore } from '../store/appStore';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { FAB } from '../components/ui/FAB';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { formatCurrency, getCategoryIcon, getStatusLabel } from '../utils/helpers';
import { Budget } from '../types';

function monthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

function BudgetCard({
  budget,
  spent,
  currency,
  onPress,
  onLongPress,
}: {
  budget: Budget;
  spent: number;
  currency: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const percent = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
  const over = spent > budget.amount;

  return (
    <Card style={styles.card} padding={spacing.lg} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.cardHeader}>
        <View style={styles.category}>
          <View style={[styles.iconTile, { backgroundColor: over ? colors.errorLight : colors.primaryFaded }]}>
            <Icon name={getCategoryIcon(budget.category)} size={16} color={over ? colors.error : colors.primary} />
          </View>
          <Text style={styles.categoryLabel}>{getStatusLabel(budget.category)}</Text>
        </View>
        {over ? <Badge text="Over budget" color={colors.error} backgroundColor={colors.errorLight} size="small" /> : null}
      </View>
      <View style={styles.amounts}>
        <Text style={styles.spent}>{formatCurrency(spent, currency)}</Text>
        <Text style={styles.of}> / {formatCurrency(budget.amount, currency)}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${percent}%`, backgroundColor: over ? colors.error : colors.primary },
          ]}
        />
      </View>
      <Text style={styles.percent}>{Math.round(percent)}% used</Text>
    </Card>
  );
}

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [month, setMonth] = useState<Date>(() => new Date());
  const budgets = useBudgetStore((s) => s.budgets.data);
  const isLoading = useBudgetStore((s) => s.budgets.isLoading);
  const error = useBudgetStore((s) => s.budgets.error);
  const fetchBudgets = useBudgetStore((s) => s.fetchBudgets);
  const setFilters = useBudgetStore((s) => s.setFilters);
  const deleteBudget = useBudgetStore((s) => s.deleteBudget);
  const expenses = useExpensesStore((s) => s.expenses.data);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);
  const currency = useAppStore((s) => s.settings.currency);

  useFocusEffect(
    useCallback(() => {
      setFilters({ month: monthKey(month) });
      fetchBudgets();
      fetchExpenses();
    }, [fetchBudgets, fetchExpenses, setFilters, month])
  );

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const expense of expenses) {
      if (!expense.date.startsWith(monthKey(month))) continue;
      map[expense.category] = (map[expense.category] || 0) + expense.amount;
    }
    return map;
  }, [expenses, month]);

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (spentByCategory[b.category] || 0), 0);

  const confirmDelete = useCallback(
    (budget: Budget) => {
      Alert.alert('Delete Budget', `Delete the ${getStatusLabel(budget.category)} budget?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudget(budget.id);
            } catch {
              Alert.alert('Error', 'Failed to delete budget.');
            }
          },
        },
      ]);
    },
    [deleteBudget]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Budgets"
        subtitle={format(month, 'MMMM yyyy')}
        leftAction={{ icon: 'arrow-back', onPress: () => router.back() }}
      />
      <View style={styles.container}>
        <View style={styles.monthNav}>
          <Button title="Prev" variant="outline" size="small" onPress={() => setMonth((m) => addMonths(m, -1))} />
          <Text style={styles.monthLabel}>{format(month, 'MMM yyyy')}</Text>
          <Button title="Next" variant="outline" size="small" onPress={() => setMonth((m) => addMonths(m, 1))} />
        </View>
        <Card style={styles.totalCard} padding={spacing.lg}>
          <Text style={styles.totalLabel}>Budget vs Spent</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(totalSpent, currency)} <Text style={styles.totalOf}>of {formatCurrency(totalBudget, currency)}</Text>
          </Text>
        </Card>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {budgets.length === 0 && !isLoading ? (
          <EmptyState
            title="No Budgets Set"
            message="Set a monthly budget per expense category to track overspending."
            icon="pie-chart-outline"
            action={<Button title="Add a budget" variant="outline" onPress={() => router.push('/budget-form')} />}
          />
        ) : (
          <FlatList
            data={budgets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BudgetCard
                budget={item}
                spent={spentByCategory[item.category] || 0}
                currency={currency}
                onPress={() => router.push(`/budget-form?id=${item.id}`)}
                onLongPress={() => confirmDelete(item)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchBudgets}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}
        <FAB icon="add" onPress={() => router.push('/budget-form')} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      paddingBottom: 0,
    },
    monthLabel: { ...typography.h4, color: colors.textPrimary },
    totalCard: { margin: spacing.lg, marginTop: spacing.md },
    totalLabel: { ...typography.label, color: colors.textSecondary },
    totalValue: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.xs },
    totalOf: { ...typography.bodySmall, color: colors.textTertiary },
    list: { paddingHorizontal: spacing.lg },
    card: { marginBottom: spacing.md },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    category: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    iconTile: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    categoryLabel: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    amounts: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.sm },
    spent: { ...typography.h4, color: colors.textPrimary },
    of: { ...typography.bodySmall, color: colors.textTertiary },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surfaceVariant,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 4 },
    percent: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    errorText: {
      ...typography.caption,
      color: colors.error,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
  });
