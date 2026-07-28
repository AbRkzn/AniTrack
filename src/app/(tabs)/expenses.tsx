import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpensesStore } from '../../store/expensesStore';
import { Header } from '../../components/ui/Header';
import { Card, StatCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { FAB } from '../../components/ui/FAB';
import { colors, typography, spacing } from '../../constants/theme';
import { formatDate, formatCurrency, getCategoryIcon } from '../../utils/helpers';
import { Expense } from '../../types';

function ExpenseCard({ expense }: { expense: Expense }) {
  return (
    <Card style={styles.expenseCard} padding={spacing.lg}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseCategory}>
          <Text style={styles.categoryIcon}>{getCategoryIcon(expense.category)}</Text>
          <Text style={styles.categoryLabel}>{expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</Text>
        </View>
        <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
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
  const expenses = useExpensesStore((s) => s.expenses.data);
  const isLoading = useExpensesStore((s) => s.expenses.isLoading);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Expenses" subtitle={${expenses.length} records} />
      <View style={styles.container}>
        <View style={styles.summaryRow}>
          <StatCard title="Total Expenses" value={formatCurrency(totalExpenses)} icon="??" color={colors.light.error} style={styles.summaryCard} />
          <StatCard title="Categories" value={new Set(expenses.map((e) => e.category)).size.toString()} icon="??" style={styles.summaryCard} />
        </View>
        {expenses.length === 0 && !isLoading ? (
          <EmptyState
            title="No Expenses Logged"
            message="Track your farm expenses by adding your first entry."
            icon="??"
          />
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ExpenseCard expense={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
        <FAB icon="+" onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.surface },
  container: { flex: 1, backgroundColor: colors.light.background },
  summaryRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  summaryCard: { flex: 1 },
  list: { padding: spacing.lg, paddingTop: 0 },
  expenseCard: { marginBottom: spacing.md },
  expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  expenseCategory: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  categoryIcon: { fontSize: 20 },
  categoryLabel: { ...typography.body, fontWeight: '600', color: colors.light.textPrimary },
  expenseAmount: { ...typography.h4, color: colors.light.error },
  expenseDetails: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  expenseDate: { ...typography.bodySmall, color: colors.light.textSecondary },
  expenseVendor: { ...typography.bodySmall, color: colors.light.textSecondary },
  expenseNotes: { ...typography.caption, color: colors.light.textTertiary, marginTop: spacing.sm, fontStyle: 'italic' },
});
