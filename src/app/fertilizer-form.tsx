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
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFertilizerStore } from '../store/fertilizerStore';
import { useCropsStore } from '../store/cropsStore';
import { Header } from '../components/ui/Header';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DateField } from '../components/ui/DateField';
import { ChipSelect } from '../components/ui/ChipSelect';
import { Button } from '../components/ui/Button';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { FertilizerApplication, FertilizerType, ApplicationMethod } from '../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const MEASURE_UNITS = ['kg', 'tons', 'sacks', 'pieces', 'liters', 'boxes', 'bunches', 'pcs', 'pails'];

const TYPE_OPTIONS: { label: string; value: FertilizerType }[] = [
  { label: 'Nitrogen', value: 'nitrogen' },
  { label: 'Phosphate', value: 'phosphate' },
  { label: 'Potash', value: 'potash' },
  { label: 'Compound', value: 'compound' },
  { label: 'Organic', value: 'organic' },
  { label: 'Foliar', value: 'foliar' },
  { label: 'Other', value: 'other' },
];

const METHOD_OPTIONS: { label: string; value: ApplicationMethod }[] = [
  { label: 'Broadcast', value: 'broadcast' },
  { label: 'Banding', value: 'banding' },
  { label: 'Side Dressing', value: 'side_dressing' },
  { label: 'Fertigation', value: 'fertigation' },
  { label: 'Foliar Spray', value: 'foliar_spray' },
  { label: 'Injection', value: 'injection' },
];

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Skipped', value: 'skipped' },
];

const REMINDER_OPTIONS: { label: string; value: string }[] = [
  { label: 'On', value: '1' },
  { label: 'Off', value: '0' },
];

const fertilizerSchema = z.object({
  cropId: z.string().min(1, 'Select a crop'),
  fertilizerName: z.string().min(1, 'Fertilizer name is required'),
  fertilizerType: z.enum(['nitrogen', 'phosphate', 'potash', 'compound', 'organic', 'foliar', 'other']),
  applicationMethod: z.enum(['broadcast', 'banding', 'side_dressing', 'fertigation', 'foliar_spray', 'injection']),
  amountPerUnit: z.string().refine((v) => v.trim() === '' || !Number.isNaN(Number(v)), 'Enter a valid number'),
  totalAmount: z.string().refine((v) => v.trim() === '' || !Number.isNaN(Number(v)), 'Enter a valid number'),
  unit: z.string(),
  scheduledDate: z.string().regex(DATE_RE, 'Use YYYY-MM-DD'),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
  reminderEnabled: z.enum(['1', '0']),
  notes: z.string(),
});

type FertilizerFormValues = z.infer<typeof fertilizerSchema>;

const today = () => new Date().toISOString().split('T')[0];

export default function FertilizerFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const applicationId = typeof id === 'string' && id ? id : undefined;
  const isEditing = !!applicationId;

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { addApplication, updateApplication, deleteApplication, getApplicationById } = useFertilizerStore();
  const crops = useCropsStore((s) => s.crops.data);
  const fetchCrops = useCropsStore((s) => s.fetchCrops);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FertilizerFormValues>({
    resolver: zodResolver(fertilizerSchema),
    defaultValues: {
      cropId: '',
      fertilizerName: '',
      fertilizerType: 'compound',
      applicationMethod: 'broadcast',
      amountPerUnit: '',
      totalAmount: '',
      unit: 'kg',
      scheduledDate: today(),
      status: 'pending',
      reminderEnabled: '1',
      notes: '',
    },
  });

  const [loading, setLoading] = useState(isEditing);
  const [existing, setExisting] = useState<FertilizerApplication | null>(null);

  useEffect(() => {
    if (crops.length === 0) fetchCrops();
  }, [crops.length, fetchCrops]);

  useEffect(() => {
    if (!isEditing) return;
    let mounted = true;
    (async () => {
      const application = await getApplicationById(applicationId);
      if (!mounted) return;
      if (application) {
        setExisting(application);
        reset({
          cropId: application.cropId,
          fertilizerName: application.fertilizerName,
          fertilizerType: application.fertilizerType,
          applicationMethod: application.applicationMethod,
          amountPerUnit: String(application.amountPerUnit),
          totalAmount: String(application.totalAmount),
          unit: application.unit,
          scheduledDate: application.scheduledDate,
          status: application.status,
          reminderEnabled: application.reminderEnabled ? '1' : '0',
          notes: application.notes ?? '',
        });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isEditing, applicationId, getApplicationById, reset]);

  const onSubmit = useCallback(
    async (values: FertilizerFormValues) => {
      const payload: Omit<FertilizerApplication, 'id' | 'createdAt' | 'updatedAt'> = {
        cropId: values.cropId,
        fertilizerName: values.fertilizerName.trim(),
        fertilizerType: values.fertilizerType as FertilizerType,
        applicationMethod: values.applicationMethod as ApplicationMethod,
        amountPerUnit: values.amountPerUnit.trim() === '' ? 0 : Number(values.amountPerUnit),
        totalAmount: values.totalAmount.trim() === '' ? 0 : Number(values.totalAmount),
        unit: values.unit.trim() || 'kg',
        scheduledDate: values.scheduledDate,
        completedDate:
          values.status === 'completed'
            ? (existing?.completedDate ?? today())
            : values.status === 'pending' || values.status === 'skipped'
              ? undefined
              : (existing?.completedDate ?? undefined),
        status: values.status,
        notes: values.notes.trim(),
        reminderEnabled: values.reminderEnabled === '1',
      };
      try {
        if (applicationId) await updateApplication(applicationId, payload);
        else await addApplication(payload);
        router.back();
      } catch {
        Alert.alert('Error', 'Failed to save application. Please try again.');
      }
    },
    [applicationId, existing, addApplication, updateApplication]
  );

  const onDelete = useCallback(() => {
    if (!applicationId) return;
    Alert.alert('Delete Application', 'This will permanently delete this fertilizer application.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteApplication(applicationId);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete application.');
          }
        },
      },
    ]);
  }, [applicationId, deleteApplication]);

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
        title={isEditing ? 'Edit Application' : 'Schedule Application'}
        leftAction={{ icon: 'close', onPress: () => router.back() }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {crops.length > 0 ? (
            <ChipSelect
              label="Crop *"
              options={crops.map((c) => ({ label: c.name, value: c.id }))}
              value={watch('cropId')}
              onChange={(value) => setValue('cropId', value, { shouldValidate: true })}
              error={errors.cropId?.message}
            />
          ) : (
            <View style={styles.noCrops}>
              <Text style={styles.noCropsText}>Add a crop before scheduling an application.</Text>
              <TouchableOpacity onPress={() => router.push('/crop-form')} activeOpacity={0.7}>
                <Text style={styles.noCropsLink}>+ Add a crop</Text>
              </TouchableOpacity>
            </View>
          )}
          <Input
            label="Fertilizer name *"
            placeholder="e.g. NPK 15-15-15"
            error={errors.fertilizerName?.message}
            {...register('fertilizerName')}
          />
          <ChipSelect
            label="Fertilizer type"
            options={TYPE_OPTIONS}
            value={watch('fertilizerType')}
            onChange={(value) => setValue('fertilizerType', value as FertilizerType, { shouldValidate: true })}
            error={errors.fertilizerType?.message}
          />
          <ChipSelect
            label="Application method"
            options={METHOD_OPTIONS}
            value={watch('applicationMethod')}
            onChange={(value) => setValue('applicationMethod', value as ApplicationMethod, { shouldValidate: true })}
            error={errors.applicationMethod?.message}
          />
          <Input
            label="Amount per application"
            placeholder="0"
            keyboardType="numeric"
            error={errors.amountPerUnit?.message}
            {...register('amountPerUnit')}
          />
          <Input
            label="Total amount"
            placeholder="0"
            keyboardType="numeric"
            error={errors.totalAmount?.message}
            {...register('totalAmount')}
          />
          <Select
            label="Unit *"
            placeholder="Choose a unit"
            options={MEASURE_UNITS.map((u) => ({ label: u, value: u }))}
            value={watch('unit')}
            onChange={(v) => setValue('unit', v, { shouldValidate: true })}
            allowCustom
            error={errors.unit?.message}
          />
          <DateField
            label="Scheduled date *"
            value={watch('scheduledDate')}
            onChange={(v) => setValue('scheduledDate', v, { shouldValidate: true })}
            error={errors.scheduledDate?.message}
          />
          <ChipSelect
            label="Status"
            options={STATUS_OPTIONS}
            value={watch('status')}
            onChange={(value) => setValue('status', value as FertilizerApplication['status'], { shouldValidate: true })}
            error={errors.status?.message}
          />
          <ChipSelect
            label="Reminder"
            options={REMINDER_OPTIONS}
            value={watch('reminderEnabled')}
            onChange={(value) => setValue('reminderEnabled', value as '1' | '0', { shouldValidate: true })}
            error={errors.reminderEnabled?.message}
          />
          <TextArea label="Notes" placeholder="Optional notes..." error={errors.notes?.message} {...register('notes')} />
          <Button
            title={isEditing ? 'Save Changes' : 'Schedule Application'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            style={styles.submit}
          />
          {isEditing && (
            <Button title="Delete Application" variant="danger" onPress={onDelete} fullWidth style={styles.deleteButton} />
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
    noCrops: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    noCropsText: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
    noCropsLink: { ...typography.buttonSmall, color: colors.primary },
    submit: { marginTop: spacing.sm },
    deleteButton: { marginTop: spacing.md },
  });
