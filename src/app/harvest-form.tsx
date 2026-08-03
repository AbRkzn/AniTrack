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
import { useHarvestsStore } from '../store/harvestsStore';
import { useCropsStore } from '../store/cropsStore';
import { Header } from '../components/ui/Header';
import { Input, TextArea } from '../components/ui/Input';
import { ChipSelect } from '../components/ui/ChipSelect';
import { Button } from '../components/ui/Button';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { Harvest } from '../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const harvestSchema = z.object({
  cropId: z.string().min(1, 'Select a crop'),
  harvestDate: z.string().regex(DATE_RE, 'Use YYYY-MM-DD'),
  quantity: z.string().refine(
    (v) => v.trim() !== '' && !Number.isNaN(Number(v)) && Number(v) > 0,
    'Enter a valid quantity'
  ),
  unit: z.string().min(1, 'Unit is required'),
  quality: z.string(),
  buyer: z.string(),
  revenue: z.string().refine((v) => v.trim() === '' || !Number.isNaN(Number(v)), 'Enter a valid number'),
  sellingPrice: z.string().refine((v) => v.trim() === '' || !Number.isNaN(Number(v)), 'Enter a valid number'),
  notes: z.string(),
});

type HarvestFormValues = z.infer<typeof harvestSchema>;

const today = () => new Date().toISOString().split('T')[0];

export default function HarvestFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const harvestId = typeof id === 'string' && id ? id : undefined;
  const isEditing = !!harvestId;

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { addHarvest, updateHarvest, deleteHarvest, getHarvestById } = useHarvestsStore();
  const crops = useCropsStore((s) => s.crops.data);
  const fetchCrops = useCropsStore((s) => s.fetchCrops);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HarvestFormValues>({
    resolver: zodResolver(harvestSchema),
    defaultValues: {
      cropId: '',
      harvestDate: today(),
      quantity: '',
      unit: 'kg',
      quality: '',
      buyer: '',
      revenue: '',
      sellingPrice: '',
      notes: '',
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
      const harvest = await getHarvestById(harvestId);
      if (!mounted) return;
      if (harvest) {
        reset({
          cropId: harvest.cropId,
          harvestDate: harvest.harvestDate,
          quantity: String(harvest.quantity),
          unit: harvest.unit,
          quality: harvest.quality ?? '',
          buyer: harvest.buyer ?? '',
          revenue: harvest.revenue != null && harvest.revenue > 0 ? String(harvest.revenue) : '',
          sellingPrice: harvest.sellingPrice != null && harvest.sellingPrice > 0 ? String(harvest.sellingPrice) : '',
          notes: harvest.notes ?? '',
        });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isEditing, harvestId, getHarvestById, reset]);

  const onSubmit = useCallback(
    async (values: HarvestFormValues) => {
      const payload: Omit<Harvest, 'id' | 'createdAt' | 'updatedAt'> = {
        cropId: values.cropId,
        harvestDate: values.harvestDate,
        quantity: Number(values.quantity),
        unit: values.unit.trim() || 'kg',
        quality: values.quality.trim() || undefined,
        buyer: values.buyer.trim() || undefined,
        revenue: values.revenue.trim() === '' ? undefined : Number(values.revenue),
        sellingPrice: values.sellingPrice.trim() === '' ? undefined : Number(values.sellingPrice),
        notes: values.notes.trim(),
        photos: [],
      };
      try {
        if (harvestId) await updateHarvest(harvestId, payload);
        else await addHarvest(payload);
        router.back();
      } catch {
        Alert.alert('Error', 'Failed to save harvest. Please try again.');
      }
    },
    [harvestId, addHarvest, updateHarvest]
  );

  const onDelete = useCallback(() => {
    if (!harvestId) return;
    Alert.alert('Delete Harvest', 'This will permanently delete this harvest record.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteHarvest(harvestId);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete harvest.');
          }
        },
      },
    ]);
  }, [harvestId, deleteHarvest]);

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
        title={isEditing ? 'Edit Harvest' : 'Log Harvest'}
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
              <Text style={styles.noCropsText}>Add a crop before logging a harvest.</Text>
              <TouchableOpacity onPress={() => router.push('/crop-form')} activeOpacity={0.7}>
                <Text style={styles.noCropsLink}>+ Add a crop</Text>
              </TouchableOpacity>
            </View>
          )}
          <Input
            label="Harvest date (YYYY-MM-DD) *"
            placeholder="2026-08-02"
            error={errors.harvestDate?.message}
            {...register('harvestDate')}
          />
          <Input
            label="Quantity *"
            placeholder="0"
            keyboardType="numeric"
            error={errors.quantity?.message}
            {...register('quantity')}
          />
          <Input label="Unit" placeholder="kg" error={errors.unit?.message} {...register('unit')} />
          <Input label="Quality" placeholder="e.g. Grade A" error={errors.quality?.message} {...register('quality')} />
          <Input label="Buyer" placeholder="e.g. Farmer Co-op" error={errors.buyer?.message} {...register('buyer')} />
          <Input
            label="Revenue"
            placeholder="0.00"
            keyboardType="decimal-pad"
            error={errors.revenue?.message}
            {...register('revenue')}
          />
          <Input
            label="Selling price per unit"
            placeholder="0.00"
            keyboardType="decimal-pad"
            error={errors.sellingPrice?.message}
            {...register('sellingPrice')}
          />
          <TextArea label="Notes" placeholder="Optional notes..." error={errors.notes?.message} {...register('notes')} />
          <Button
            title={isEditing ? 'Save Changes' : 'Add Harvest'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            style={styles.submit}
          />
          {isEditing && (
            <Button title="Delete Harvest" variant="danger" onPress={onDelete} fullWidth style={styles.deleteButton} />
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
    noCrops: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      gap: spacing.xs,
    },
    noCropsText: { ...typography.body, color: colors.textSecondary },
    noCropsLink: { ...typography.body, color: colors.primary, fontWeight: '600' },
  });
