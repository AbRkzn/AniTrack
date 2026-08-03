import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpensesStore } from '../store/expensesStore';
import { useCropsStore } from '../store/cropsStore';
import { useAppStore } from '../store/appStore';
import { Header } from '../components/ui/Header';
import { Input, TextArea } from '../components/ui/Input';
import { ChipSelect } from '../components/ui/ChipSelect';
import { Button } from '../components/ui/Button';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { Expense, ExpenseCategory } from '../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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
  { label: 'Other', value: 'other' },
];

const expenseSchema = z.object({
  category: z.enum([
    'seed',
    'fertilizer',
    'pesticide',
    'equipment',
    'labor',
    'irrigation',
    'fuel',
    'maintenance',
    'transport',
    'utility',
    'insurance',
    'rent',
    'other',
  ]),
  amount: z.string().refine(
    (v) => v.trim() !== '' && !Number.isNaN(Number(v)) && Number(v) > 0,
    'Enter a valid amount'
  ),
  date: z.string().regex(DATE_RE, 'Use YYYY-MM-DD'),
  cropId: z.string(),
  vendor: z.string(),
  notes: z.string(),
  recurring: z.boolean(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const NONE = '__none__';
const today = () => new Date().toISOString().split('T')[0];

export default function ExpenseFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const expenseId = typeof id === 'string' && id ? id : undefined;
  const isEditing = !!expenseId;

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { addExpense, updateExpense, deleteExpense, getExpenseById } = useExpensesStore();
  const crops = useCropsStore((s) => s.crops.data);
  const fetchCrops = useCropsStore((s) => s.fetchCrops);
  const currency = useAppStore((s) => s.settings.currency);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'seed',
      amount: '',
      date: today(),
      cropId: NONE,
      vendor: '',
      notes: '',
      recurring: false,
    },
  });

  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (crops.length === 0) fetchCrops();
  }, [crops.length, fetchCrops]);

  useEffect(() => {
    if (!isEditing) return;
    let mounted = true;
    (async () => {
      const expense = await getExpenseById(expenseId);
      if (!mounted) return;
      if (expense) {
        reset({
          category: expense.category,
          amount: String(expense.amount),
          date: expense.date,
          cropId: expense.cropId || NONE,
          vendor: expense.vendor ?? '',
          notes: expense.notes ?? '',
          recurring: expense.recurring,
        });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isEditing, expenseId, getExpenseById, reset]);

  const onSubmit = useCallback(
    async (values: ExpenseFormValues) => {
      const payload: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
        category: values.category,
        amount: Number(values.amount),
        currency: currency,
        date: values.date,
        cropId: values.cropId && values.cropId !== NONE ? values.cropId : undefined,
        vendor: values.vendor.trim() || undefined,
        notes: values.notes.trim(),
        recurring: values.recurring,
      };
      try {
        if (expenseId) await updateExpense(expenseId, payload);
        else await addExpense(payload);
        router.back();
      } catch {
        Alert.alert('Error', 'Failed to save expense. Please try again.');
      }
    },
    [expenseId, addExpense, updateExpense, currency]
  );

  const onDelete = useCallback(() => {
    if (!expenseId) return;
    Alert.alert('Delete Expense', 'This will permanently delete this expense.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(expenseId);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete expense.');
          }
        },
      },
    ]);
  }, [expenseId, deleteExpense]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const cropOptions = [{ label: 'None', value: NONE }, ...crops.map((c) => ({ label: c.name, value: c.id }))];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header
        title={isEditing ? 'Edit Expense' : 'Add Expense'}
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
            label="Amount *"
            placeholder="0.00"
            keyboardType="decimal-pad"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input
            label="Date (YYYY-MM-DD) *"
            placeholder="2026-08-02"
            error={errors.date?.message}
            {...register('date')}
          />
          <ChipSelect
            label="Linked crop (optional)"
            options={cropOptions}
            value={watch('cropId')}
            onChange={(value) => setValue('cropId', value, { shouldValidate: true })}
          />
          <Input label="Vendor" placeholder="e.g. Agri Supplies" error={errors.vendor?.message} {...register('vendor')} />
          <TextArea label="Notes" placeholder="Optional notes..." error={errors.notes?.message} {...register('notes')} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Recurring expense</Text>
            <Controller
              control={control}
              name="recurring"
              render={({ field }) => (
                <Switch
                  value={field.value}
                  onValueChange={field.onChange}
                  trackColor={{ true: colors.primary }}
                />
              )}
            />
          </View>
          <Button
            title={isEditing ? 'Save Changes' : 'Add Expense'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            style={styles.submit}
          />
          {isEditing && (
            <Button title="Delete Expense" variant="danger" onPress={onDelete} fullWidth style={styles.deleteButton} />
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
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    switchLabel: { ...typography.label, color: colors.textPrimary },
  });
