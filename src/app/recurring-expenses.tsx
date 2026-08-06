import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { addDays, addMonths, addYears, format } from 'date-fns';
import { useExpensesStore } from '../store/expensesStore';
import { useAppStore } from '../store/appStore';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { formatDate, formatCurrency, getCategoryIcon, getStatusLabel } from '../utils/helpers';
import { Expense } from '../types';

function nextOccurrence(source: Expense, expenses: Expense[]): string {
  const last = expenses
    .filter((e) => e.recurringSourceId === source.id)
    .reduce((max, e) => (e.date > max ? e.date : max), source.date);
  const interval = source.recurringInterval || 'monthly';
  const base = new Date(`${last}T00:00:00`);
  let next: Date;
  switch (interval) {
    case 'daily':
      next = addDays(base, 1);
      break;
    case 'weekly':
      next = addDays(base, 7);
      break;
    case 'yearly':
      next = addYears(base, 1);
      break;
    default:
      next = addMonths(base, 1);
  }
  return format(next, 'yyyy-MM-dd');
}

function RecurringCard({
  source,
  nextDate,
  generatedCount,
  onEdit,
  onStop,
}: {
  source: Expense;
  nextDate: string;
  generatedCount: number;
  onEdit: () => void;
  onStop: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currency = useAppStore((s) => s.settings.currency);

  return (
    <Card style={styles.card} padding={spacing.lg} onPress={onEdit}>
      <View style={styles.cardHeader}>
        <View style={styles.cardCategory}>
          <View style={styles.categoryIconTile}>
            <Icon name={getCategoryIcon(source.category)} size={16} color={colors.primary} />
          </View>
          <Text style={styles.categoryLabel}>{getStatusLabel(source.category)}</Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(source.amount, currency)}</Text>
      </View>
      <View style={styles.detailsRow}>
        <View style={styles.intervalBadge}>
          <Icon name="repeat-outline" size={12} color={colors.primary} />
          <Text style={styles.intervalText}>
            {getStatusLabel(source.recurringInterval || 'monthly')}
          </Text>
        </View>
        <Text style={styles.detail}>Every {getStatusLabel(source.recurringInterval || 'monthly').toLowerCase()}</Text>
      </View>
      <View style={styles.detailsRow}>
        <Text style={styles.detail}>Since {formatDate(source.date, 'MMM dd, yyyy')}</Text>
        <Text style={styles.detail}>Next {formatDate(nextDate, 'MMM dd, yyyy')}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.generated}>{generatedCount} entr{generatedCount === 1 ? 'y' : 'ies'} generated</Text>
        <TouchableOpacity onPress={onStop} hitSlop={8} activeOpacity={0.7}>
          <Text style={styles.stopText}>Stop Recurring</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export default function RecurringExpensesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const expenses = useExpensesStore((s) => s.expenses.data);
  const isLoading = useExpensesStore((s) => s.expenses.isLoading);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);
  const updateExpense = useExpensesStore((s) => s.updateExpense);

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [fetchExpenses])
  );

  const sources = useMemo(() => expenses.filter((e) => e.recurring), [expenses]);

  const confirmStop = useCallback(
    (source: Expense) => {
      Alert.alert(
        'Stop Recurring',
        'This expense will no longer repeat automatically. Existing entries are kept.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop Recurring',
            style: 'destructive',
            onPress: async () => {
              try {
                await updateExpense(source.id, { recurring: false, recurringInterval: undefined });
              } catch {
                Alert.alert('Error', 'Failed to update expense.');
              }
            },
          },
        ]
      );
    },
    [updateExpense]
  );

  if (isLoading && sources.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header
          title="Recurring Expenses"
          subtitle="Automatically repeating expense templates"
          leftAction={{ icon: 'close', onPress: () => router.back() }}
        />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Recurring Expenses"
        subtitle={sources.length === 0 ? 'No active templates' : `${sources.length} active template${sources.length === 1 ? '' : 's'}`}
        leftAction={{ icon: 'close', onPress: () => router.back() }}
      />
      {sources.length === 0 ? (
        <EmptyState
          icon="repeat-outline"
          title="No Recurring Expenses"
          message="Mark an expense as recurring in the expense form and it will repeat automatically each day, week, month, or year."
        />
      ) : (
        <FlatList
          data={sources}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecurringCard
              source={item}
              nextDate={nextOccurrence(item, expenses)}
              generatedCount={expenses.filter((e) => e.recurringSourceId === item.id).length}
              onEdit={() => router.push(`/expense-form?id=${item.id}`)}
              onStop={() => confirmStop(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Text style={styles.note}>
              Tap a template to edit it. Templates are also visible as "Recurring" entries in the Expenses list.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    list: { padding: spacing.lg },
    card: { marginBottom: spacing.md },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    cardCategory: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    categoryIconTile: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.primaryFaded,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryLabel: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    amount: { ...typography.h4, color: colors.error },
    detailsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
    intervalBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primaryFaded,
      borderRadius: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    intervalText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
    detail: { ...typography.bodySmall, color: colors.textSecondary },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    generated: { ...typography.caption, color: colors.textTertiary },
    stopText: { ...typography.caption, color: colors.error, fontWeight: '700' },
    note: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
  });
