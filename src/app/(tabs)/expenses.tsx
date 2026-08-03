import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useExpensesStore } from '../../store/expensesStore';
import { useAppStore } from '../../store/appStore';
import { Header } from '../../components/ui/Header';
import { Card, StatCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { FAB } from '../../components/ui/FAB';
import { Icon } from '../../components/ui/Icon';
import { typography, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { formatDate, formatCurrency, getCategoryIcon } from '../../utils/helpers';
import { Expense } from '../../types';

function ExpenseCard({ expense, onPress, onLongPress }: { expense: Expense; onPress: () => void; onLongPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currency = useAppStore((s) => s.settings.currency);
  return (
    <Card style={styles.expenseCard} padding={spacing.lg} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseCategory}>
          <View style={styles.categoryIconTile}>
            <Icon name={getCategoryIcon(expense.category)} size={16} color={colors.primary} />
          </View>
          <Text style={styles.categoryLabel}>{expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</Text>
        </View>
        <Text style={styles.expenseAmount}>{formatCurrency(expense.amount, currency)}</Text>
      </View>
      <View style={styles.expenseDetails}>
        <Text style={styles.expenseDate}>{formatDate(expense.date, 'MMM dd, yyyy')}</Text>
        {expense.vendor && <Text style={styles.expenseVendor}>Vendor: {expense.vendor}</Text>}
        {expense.recurring && <Badge text="Recurring" size="small" />}
      </View>
      {expense.notes ? <Text style={styles.expenseNotes}>{expense.notes}</Text> : null}
    </Card>
  );
}

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const expenses = useExpensesStore((s) => s.expenses.data);
  const isLoading = useExpensesStore((s) => s.expenses.isLoading);
  const error = useExpensesStore((s) => s.expenses.error);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);
  const deleteExpense = useExpensesStore((s) => s.deleteExpense);
  const currency = useAppStore((s) => s.settings.currency);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryCount = new Set(expenses.map((e) => e.category)).size.toString();
  const subtitle = `${expenses.length} records`;

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [fetchExpenses])
  );

  const confirmDelete = useCallback(
    (expense: Expense) => {
      Alert.alert('Delete Expense', `Delete the ${expense.category} expense of ${formatCurrency(expense.amount, currency)}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(expense.id);
            } catch {
              Alert.alert('Error', 'Failed to delete expense.');
            }
          },
        },
      ]);
    },
    [deleteExpense]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Expenses" subtitle={subtitle} />
      <View style={styles.container}>
        <View style={styles.summaryRow}>
          <StatCard title="Total Expenses" value={formatCurrency(totalExpenses, currency)} icon="cash-outline" color={colors.error} style={styles.summaryCard} />
          <StatCard title="Categories" value={categoryCount} icon="pricetag-outline" style={styles.summaryCard} />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {expenses.length === 0 && !isLoading ? (
          <EmptyState
            title="No Expenses Logged"
            message="Track your farm expenses by adding your first entry."
            icon="wallet-outline"
          />
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ExpenseCard
                expense={item}
                onPress={() => router.push(`/expense-form?id=${item.id}`)}
                onLongPress={() => confirmDelete(item)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchExpenses}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}
        <FAB icon="add" onPress={() => router.push('/expense-form')} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    summaryRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
    summaryCard: { flex: 1 },
    list: { padding: spacing.lg, paddingTop: 0 },
    expenseCard: { marginBottom: spacing.md },
    expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    expenseCategory: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    categoryIconTile: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.primaryFaded,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryLabel: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    expenseAmount: { ...typography.h4, color: colors.error },
    expenseDetails: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
    expenseDate: { ...typography.bodySmall, color: colors.textSecondary },
    expenseVendor: { ...typography.bodySmall, color: colors.textSecondary },
    expenseNotes: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.sm, fontStyle: 'italic' },
    errorText: {
      ...typography.caption,
      color: colors.error,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
    },
  });
