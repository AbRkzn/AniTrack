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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCropsStore } from '../store/cropsStore';
import { Header } from '../components/ui/Header';
import { Input, TextArea } from '../components/ui/Input';
import { ChipSelect } from '../components/ui/ChipSelect';
import { Button } from '../components/ui/Button';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { Crop, CropStatus } from '../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const STATUS_OPTIONS: { label: string; value: CropStatus }[] = [
  { label: 'Growing', value: 'growing' },
  { label: 'Ready', value: 'ready_for_harvest' },
  { label: 'Harvested', value: 'harvested' },
  { label: 'Failed', value: 'failed' },
];

const cropSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  variety: z.string(),
  fieldLocation: z.string(),
  plantingDate: z.string().regex(DATE_RE, 'Use YYYY-MM-DD'),
  expectedHarvestDate: z.string().regex(DATE_RE, 'Use YYYY-MM-DD'),
  status: z.enum(['growing', 'ready_for_harvest', 'harvested', 'failed']),
  yieldEstimate: z.string().refine((v) => v.trim() === '' || !Number.isNaN(Number(v)), 'Enter a valid number'),
  yieldUnit: z.string(),
  notes: z.string(),
});

type CropFormValues = z.infer<typeof cropSchema>;

const today = () => new Date().toISOString().split('T')[0];

export default function CropFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const cropId = typeof id === 'string' && id ? id : undefined;
  const isEditing = !!cropId;

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { addCrop, updateCrop, deleteCrop, getCropById } = useCropsStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CropFormValues>({
    resolver: zodResolver(cropSchema),
    defaultValues: {
      name: '',
      variety: '',
      fieldLocation: '',
      plantingDate: today(),
      expectedHarvestDate: today(),
      status: 'growing',
      yieldEstimate: '',
      yieldUnit: 'kg',
      notes: '',
    },
  });

  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    let mounted = true;
    (async () => {
      const crop = await getCropById(cropId);
      if (!mounted) return;
      if (crop) {
        reset({
          name: crop.name,
          variety: crop.variety ?? '',
          fieldLocation: crop.fieldLocation ?? '',
          plantingDate: crop.plantingDate,
          expectedHarvestDate: crop.expectedHarvestDate,
          status: crop.status,
          yieldEstimate: String(crop.yieldEstimate ?? 0),
          yieldUnit: crop.yieldUnit ?? 'kg',
          notes: crop.notes ?? '',
        });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isEditing, cropId, getCropById, reset]);

  const onSubmit = useCallback(
    async (values: CropFormValues) => {
      const payload: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'> = {
        name: values.name.trim(),
        variety: values.variety.trim(),
        fieldLocation: values.fieldLocation.trim(),
        plantingDate: values.plantingDate,
        expectedHarvestDate: values.expectedHarvestDate,
        status: values.status,
        notes: values.notes.trim(),
        photos: [],
        yieldEstimate: values.yieldEstimate.trim() === '' ? 0 : Number(values.yieldEstimate),
        yieldUnit: values.yieldUnit.trim() || 'kg',
      };
      try {
        if (cropId) await updateCrop(cropId, payload);
        else await addCrop(payload);
        router.back();
      } catch {
        Alert.alert('Error', 'Failed to save crop. Please try again.');
      }
    },
    [cropId, addCrop, updateCrop]
  );

  const onDelete = useCallback(() => {
    if (!cropId) return;
    Alert.alert('Delete Crop', 'This will permanently delete this crop.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCrop(cropId);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete crop.');
          }
        },
      },
    ]);
  }, [cropId, deleteCrop]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title={isEditing ? 'Edit Crop' : 'Add Crop'} leftAction={{ icon: 'close', onPress: () => router.back() }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Input label="Crop name *" placeholder="e.g. Maize" error={errors.name?.message} {...register('name')} />
          <Input label="Variety" placeholder="e.g. SC 403" error={errors.variety?.message} {...register('variety')} />
          <Input
            label="Field location"
            placeholder="e.g. North field"
            error={errors.fieldLocation?.message}
            {...register('fieldLocation')}
          />
          <Input
            label="Planting date (YYYY-MM-DD) *"
            placeholder="2026-08-02"
            error={errors.plantingDate?.message}
            {...register('plantingDate')}
          />
          <Input
            label="Expected harvest date (YYYY-MM-DD) *"
            placeholder="2026-11-02"
            error={errors.expectedHarvestDate?.message}
            {...register('expectedHarvestDate')}
          />
          <ChipSelect
            label="Status"
            options={STATUS_OPTIONS}
            value={watch('status')}
            onChange={(value) => setValue('status', value as CropStatus, { shouldValidate: true })}
            error={errors.status?.message}
          />
          <Input
            label="Yield estimate"
            placeholder="0"
            keyboardType="numeric"
            error={errors.yieldEstimate?.message}
            {...register('yieldEstimate')}
          />
          <Input label="Yield unit" placeholder="kg" error={errors.yieldUnit?.message} {...register('yieldUnit')} />
          <TextArea label="Notes" placeholder="Optional notes..." error={errors.notes?.message} {...register('notes')} />
          <Button
            title={isEditing ? 'Save Changes' : 'Add Crop'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            style={styles.submit}
          />
          {isEditing && (
            <Button title="Delete Crop" variant="danger" onPress={onDelete} fullWidth style={styles.deleteButton} />
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
  });
