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
import { useFieldsStore } from '../store/fieldsStore';
import { Header } from '../components/ui/Header';
import { Input, TextArea } from '../components/ui/Input';
import { ChipSelect } from '../components/ui/ChipSelect';
import { Select } from '../components/ui/Select';
import { DateField } from '../components/ui/DateField';
import { Button } from '../components/ui/Button';
import { PhotoPicker } from '../components/ui/PhotoPicker';
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

const CROP_NAMES = [
  'Maize',
  'Rice',
  'Mango',
  'Banana',
  'Coconut',
  'Sugarcane',
  'Tomatoes',
  'Cabbage',
  'Eggplant',
  'Onion',
  'Garlic',
  'Sweet Potato',
  'Soybeans',
  'Chili',
  'Watermelon',
];

const CROP_VARIETIES: Record<string, string[]> = {
  Maize: ['SC 403', 'IPB Var 6', 'USM Var 10', 'Lagkitan 320', 'Green Super', 'Maya', 'Kabayan'],
  Rice: ['NSIC Rc 222', 'NSIC Rc 82', 'NSIC Rc 160', 'Dinorado', 'Japonica'],
  Mango: ['Carabao', 'Pico', 'Manila Super', 'Sweet Elena'],
  Banana: ['Lakatan', 'Latundan', 'Saba', 'Cavendish'],
  Coconut: ['Tall', 'Dwarf', 'Macauno'],
  Sugarcane: ['Phil 99-2022', 'VMC 86-550', 'VV 87-3'],
  Cabbage: ['Gloria F1', 'Scorpio', 'K-K Cross'],
  Tomatoes: ['Roma', 'Diamante Max F1', 'Marvel'],
  Eggplant: ['Dumaguete Long Purple', 'Morena', 'Pinoy F1'],
  Onion: ['Red Creole', 'Yellow Granex', 'Batanes'],
  Garlic: ['Ilocos White', 'Batangas'],
  'Sweet Potato': ['NSIC Sp-22', 'VSP-6'],
  Soybeans: ['TGx 1448-2E'],
  Chili: ['Siling Labuyo', 'Siling Haba', 'Hot Chili'],
  Watermelon: ['Sugar Baby', 'Charleston Gray'],
};

const DEFAULT_VARIETIES = ['Local', 'Improved', 'Hybrid', 'Organic'];

const YIELD_UNITS = ['kg', 'tons', 'sacks', 'pieces', 'liters', 'boxes', 'bunches'];

const cropSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  variety: z.string(),
  fieldLocation: z.string(),
  fieldId: z.string(),
  plantingDate: z.string().regex(DATE_RE, 'Use YYYY-MM-DD'),
  expectedHarvestDate: z.string().regex(DATE_RE, 'Use YYYY-MM-DD'),
  status: z.enum(['growing', 'ready_for_harvest', 'harvested', 'failed']),
  yieldEstimate: z.string().refine((v) => v.trim() === '' || !Number.isNaN(Number(v)), 'Enter a valid number'),
  yieldUnit: z.string(),
  notes: z.string(),
});

type CropFormValues = z.infer<typeof cropSchema>;

const NONE = '__none__';
const today = () => new Date().toISOString().split('T')[0];

export default function CropFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const cropId = typeof id === 'string' && id ? id : undefined;
  const isEditing = !!cropId;

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { addCrop, updateCrop, deleteCrop, getCropById } = useCropsStore();
  const fields = useFieldsStore((s) => s.fields.data);
  const fetchFields = useFieldsStore((s) => s.fetchFields);

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
      fieldId: NONE,
      plantingDate: today(),
      expectedHarvestDate: today(),
      status: 'growing',
      yieldEstimate: '',
      yieldUnit: 'kg',
      notes: '',
    },
  });

  const [loading, setLoading] = useState(isEditing);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (fields.length === 0) fetchFields();
  }, [fields.length, fetchFields]);

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
          fieldId: crop.fieldId || NONE,
          plantingDate: crop.plantingDate,
          expectedHarvestDate: crop.expectedHarvestDate,
          status: crop.status,
          yieldEstimate: String(crop.yieldEstimate ?? 0),
          yieldUnit: crop.yieldUnit ?? 'kg',
          notes: crop.notes ?? '',
        });
        setPhotos(crop.photos ?? []);
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
        fieldId: values.fieldId && values.fieldId !== NONE ? values.fieldId : undefined,
        plantingDate: values.plantingDate,
        expectedHarvestDate: values.expectedHarvestDate,
        status: values.status,
        notes: values.notes.trim(),
        photos,
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
    [cropId, addCrop, updateCrop, photos]
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

  const fieldOptions = [{ label: 'None', value: NONE }, ...fields.map((f) => ({ label: f.name, value: f.id }))];
  const cropNameOptions = useMemo(() => CROP_NAMES.map((c) => ({ label: c, value: c })), []);
  const varietyOptions = useMemo(() => {
    const list = CROP_VARIETIES[watch('name').trim()] ?? DEFAULT_VARIETIES;
    return list.map((v) => ({ label: v, value: v }));
  }, [watch('name')]);
  const locationOptions = useMemo(() => fields.map((f) => ({ label: f.name, value: f.name })), [fields]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title={isEditing ? 'Edit Crop' : 'Add Crop'} leftAction={{ icon: 'close', onPress: () => router.back() }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Select
            label="Crop name *"
            placeholder="Choose a crop"
            options={cropNameOptions}
            value={watch('name')}
            onChange={(v) => setValue('name', v, { shouldValidate: true })}
            allowCustom
            error={errors.name?.message}
          />
          <Select
            label="Variety"
            placeholder="Choose a variety"
            options={varietyOptions}
            value={watch('variety')}
            onChange={(v) => setValue('variety', v, { shouldValidate: true })}
            allowCustom
            error={errors.variety?.message}
          />
          <Select
            label="Field location"
            placeholder="Choose a location"
            options={locationOptions}
            value={watch('fieldLocation')}
            onChange={(v) => setValue('fieldLocation', v, { shouldValidate: true })}
            allowCustom
            error={errors.fieldLocation?.message}
          />
          <ChipSelect
            label="Assigned field (optional)"
            options={fieldOptions}
            value={watch('fieldId')}
            onChange={(value) => setValue('fieldId', value, { shouldValidate: true })}
          />
          <DateField
            label="Planting date *"
            value={watch('plantingDate')}
            onChange={(v) => setValue('plantingDate', v, { shouldValidate: true })}
            error={errors.plantingDate?.message}
            maximumDate={watch('expectedHarvestDate') || undefined}
          />
          <DateField
            label="Expected harvest date *"
            value={watch('expectedHarvestDate')}
            onChange={(v) => setValue('expectedHarvestDate', v, { shouldValidate: true })}
            error={errors.expectedHarvestDate?.message}
            minimumDate={watch('plantingDate') || undefined}
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
          <Select
            label="Yield unit"
            placeholder="Choose a unit"
            options={YIELD_UNITS.map((u) => ({ label: u, value: u }))}
            value={watch('yieldUnit')}
            onChange={(v) => setValue('yieldUnit', v, { shouldValidate: true })}
            allowCustom
            error={errors.yieldUnit?.message}
          />
          <TextArea label="Notes" placeholder="Optional notes..." error={errors.notes?.message} {...register('notes')} />
          <PhotoPicker photos={photos} onChange={setPhotos} />
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
