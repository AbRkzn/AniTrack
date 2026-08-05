import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addMonths } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgetStore } from '../store/budgetStore';
import { useAppStore } from '../store/appStore';
import { Header } from '../components/ui/Header';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ChipSelect } from '../components/ui/ChipSelect';
import { Button } from '../components/ui/Button';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { ExpenseCategory } from '../types';

const CATEGORY_OPTIONS: { label: string; value: ExpenseCategory }[] = [
  { label: 'Seed', value: 'seed' },
  { label: 'Fertilizer', value: 'fertilizer' },
  { label: 'Pesticide', value: 'pesticide' },
  { label: 'Equipment', value: 'equipment' },
  { label: 'Labor', value: 'labor' },
  { label: 'Irrigation', value: 'irrigation' },
  { label: 'Fuel', value: 'fuel' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Transport', value: 'transport' },
  { label: 'Utility', value: 'utility' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Rent', value: 'rent' },
  { label: 'Veterinary', value: 'veterinary' },
  { label: 'Other', value: 'other' },
];

const MONTH_RE = /^\d{4}-\d{2}$/;

const budgetSchema = z.object({
  category: z.enum([
    'seed', 'fertilizer', 'pesticide', 'equipment', 'labor',
    'irrigation', 'fuel', 'maintenance', 'transport', 'utility',
    'insurance', 'rent', 'veterinary', 'other',
  ]),
  amount: z.string().refine((v) => v.trim() !== '' && !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount'),
  month: z.string().regex(MONTH_RE, 'Use YYYY-MM'),
  notes: z.string(),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

const currentMonth = () => format(new Date(), 'yyyy-MM');

export default function BudgetFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const budgetId = typeof id === 'string' && id ? id : undefined;
  const isEditing = !!budgetId;

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { addBudget, updateBudget, deleteBudget, getBudgetById } = useBudgetStore();
  const currency = useAppStore((s) => s.settings.currency);

  const monthOptions = useMemo(() => {
    const options: { label: string; value: string }[] = [];
    const start = new Date();
    for (let i = 0; i < 24; i++) {
      const d = addMonths(start, i);
      options.push({ label: format(d, 'MMMM yyyy'), value: format(d, 'yyyy-MM') });
    }
    return options;
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: 'seed',
      amount: '',
      month: currentMonth(),
      notes: '',
    },
  });

  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    let mounted = true;
    (async () => {
      const budget = await getBudgetById(budgetId);
      if (!mounted) return;
      if (budget) {
        reset({
          category: budget.category,
          amount: String(budget.amount),
          month: budget.month,
          notes: budget.notes ?? '',
        });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isEditing, budgetId, getBudgetById, reset]);

  const onSubmit = useCallback(
    async (values: BudgetFormValues) => {
      try {
        await addBudget({
          category: values.category,
          amount: Number(values.amount),
          currency,
          month: values.month,
          notes: values.notes.trim() || undefined,
        });
        router.back();
      } catch {
        Alert.alert('Error', 'Failed to save budget. Please try again.');
      }
    },
    [addBudget, currency]
  );

  const onDelete = useCallback(() => {
    if (!budgetId) return;
    Alert.alert('Delete Budget', 'This will permanently delete this budget.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBudget(budgetId);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete budget.');
          }
        },
      },
    ]);
  }, [budgetId, deleteBudget]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header
        title={isEditing ? 'Edit Budget' : 'Add Budget'}
        leftAction={{ icon: 'close', onPress: () => router.back() }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ChipSelect
            label="Category *"
            options={CATEGORY_OPTIONS}
            value={watch('category')}
            onChange={(value) => setValue('category', value as ExpenseCategory, { shouldValidate: true })}
            error={errors.category?.message}
          />
          <Input
            label={`Monthly budget (${currency}) *`}
            placeholder="0.00"
            keyboardType="decimal-pad"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Select
            label="Month *"
            placeholder="Choose a month"
            options={monthOptions}
            value={watch('month')}
            onChange={(v) => setValue('month', v, { shouldValidate: true })}
            error={errors.month?.message}
          />
          <Text style={styles.hint}>
            Saving a budget for a category and month that already exists will update it.
          </Text>
          <TextArea label="Notes" placeholder="Optional notes..." error={errors.notes?.message} {...register('notes')} />
          <Button
            title={isEditing ? 'Save Changes' : 'Add Budget'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            style={styles.submit}
          />
          {isEditing && (
            <Button title="Delete Budget" variant="danger" onPress={onDelete} fullWidth style={styles.deleteButton} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    flex: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    submit: { marginTop: spacing.sm },
    deleteButton: { marginTop: spacing.md },
    hint: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.lg },
  });
