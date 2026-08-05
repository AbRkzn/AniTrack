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
import { useAnimalsStore } from '../store/animalsStore';
import { Header } from '../components/ui/Header';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DateField } from '../components/ui/DateField';
import { ChipSelect } from '../components/ui/ChipSelect';
import { Button } from '../components/ui/Button';
import { PhotoPicker } from '../components/ui/PhotoPicker';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { Animal, AnimalStatus } from '../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const STATUS_OPTIONS: { label: string; value: AnimalStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Sold', value: 'sold' },
  { label: 'Deceased', value: 'deceased' },
  { label: 'Transferred', value: 'transferred' },
];

const SEX_OPTIONS: { label: string; value: 'male' | 'female' }[] = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
];

const SPECIES_OPTIONS = [
  'Cattle',
  'Carabao',
  'Goat',
  'Sheep',
  'Pig',
  'Chicken',
  'Duck',
  'Horse',
  'Turkey',
  'Quail',
];

const BREED_BY_SPECIES: Record<string, string[]> = {
  Cattle: ['Brahman', 'Hereford', 'Angus', 'Holstein', 'Jersey', 'Brangus', 'Native'],
  Carabao: ['Murrah', 'Native Swamp', 'Bulgarian Murrah'],
  Goat: ['Boer', 'Anglo-Nubian', 'Saanen', 'Native'],
  Sheep: ['Dorper', 'Katahdin', 'Native'],
  Pig: ['Landrace', 'Large White', 'Duroc', 'Pietrain', 'Native'],
  Chicken: ['Broiler', 'Layer', 'Banaba', 'Leghorn'],
  Duck: ['Pekin', 'Muscovy', 'Mallard'],
  Horse: ['Thoroughbred', 'Quarter Horse', 'Philippine Pony'],
  Turkey: ['Broad Breasted White', 'Bronze'],
  Quail: ['Japanese', 'Coturnix'],
};

const WEIGHT_BY_SPECIES: Record<string, string[]> = {
  Cattle: ['150', '200', '250', '300', '350', '400', '450', '500'],
  Carabao: ['200', '300', '400', '500', '600', '700'],
  Goat: ['20', '30', '40', '50', '60', '70', '80'],
  Sheep: ['25', '35', '45', '55', '65', '75'],
  Pig: ['30', '50', '70', '90', '110', '130'],
  Chicken: ['1', '1.5', '2', '2.5', '3'],
  Duck: ['1.5', '2', '2.5', '3', '3.5'],
  Horse: ['300', '400', '450', '500'],
  Turkey: ['5', '8', '10', '12', '15'],
  Quail: ['0.1', '0.15', '0.2', '0.25'],
};

const DEFAULT_WEIGHTS = ['1', '5', '10', '20', '50', '100', '150', '200', '300', '400', '500'];

const WEIGHT_UNITS = ['kg', 'lbs', 'g', 'tons'];

const LOCATIONS = ['Barn 1', 'Barn 2', 'Barn 3', 'Pasture', 'Pens', 'Poultry House', 'Feedlot', 'Breeding Area', 'Isolation Pen', 'Free Range'];

const TAG_NUMBER_PRESETS = ['A-001', 'B-001', 'C-001', 'D-001', 'E-001', 'F-001', 'G-001'];

const animalSchema = z.object({
  tagNumber: z.string().min(1, 'Tag number is required'),
  name: z.string(),
  species: z.string().min(1, 'Species is required'),
  breed: z.string(),
  birthDate: z.string().refine((v) => v.trim() === '' || DATE_RE.test(v), 'Use YYYY-MM-DD'),
  sex: z.enum(['male', 'female']),
  weight: z.string().refine((v) => v.trim() === '' || !Number.isNaN(Number(v)), 'Enter a valid number'),
  weightUnit: z.string(),
  status: z.enum(['active', 'sold', 'deceased', 'transferred']),
  location: z.string(),
  notes: z.string(),
});

type AnimalFormValues = z.infer<typeof animalSchema>;

const today = () => new Date().toISOString().split('T')[0];

export default function AnimalFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const animalId = typeof id === 'string' && id ? id : undefined;
  const isEditing = !!animalId;

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { addAnimal, updateAnimal, deleteAnimal, getAnimalById } = useAnimalsStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnimalFormValues>({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      tagNumber: '',
      name: '',
      species: 'Cattle',
      breed: '',
      birthDate: '',
      sex: 'female',
      weight: '',
      weightUnit: 'kg',
      status: 'active',
      location: '',
      notes: '',
    },
  });

  const [loading, setLoading] = useState(isEditing);
  const [photos, setPhotos] = useState<string[]>([]);

  const breedOptions = useMemo(() => {
    const list = BREED_BY_SPECIES[watch('species')] ?? ['Local', 'Improved', 'Hybrid'];
    return list.map((b) => ({ label: b, value: b }));
  }, [watch('species')]);

  const weightOptions = useMemo(() => {
    const list = WEIGHT_BY_SPECIES[watch('species')] ?? DEFAULT_WEIGHTS;
    return list.map((w) => ({ label: w, value: w }));
  }, [watch('species')]);

  useEffect(() => {
    if (!isEditing) return;
    let mounted = true;
    (async () => {
      const animal = await getAnimalById(animalId);
      if (!mounted) return;
      if (animal) {
        reset({
          tagNumber: animal.tagNumber,
          name: animal.name ?? '',
          species: animal.species ?? 'Cattle',
          breed: animal.breed ?? '',
          birthDate: animal.birthDate ?? '',
          sex: animal.sex,
          weight: animal.weight != null ? String(animal.weight) : '',
          weightUnit: animal.weightUnit ?? 'kg',
          status: animal.status,
          location: animal.location ?? '',
          notes: animal.notes ?? '',
        });
        setPhotos(animal.photos ?? []);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isEditing, animalId, getAnimalById, reset]);

  const onSubmit = useCallback(
    async (values: AnimalFormValues) => {
      const payload: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'> = {
        tagNumber: values.tagNumber.trim(),
        name: values.name.trim() || undefined,
        species: values.species.trim(),
        breed: values.breed.trim() || undefined,
        birthDate: values.birthDate.trim() || undefined,
        sex: values.sex,
        weight: values.weight.trim() === '' ? undefined : Number(values.weight),
        weightUnit: values.weightUnit.trim() || 'kg',
        status: values.status,
        location: values.location.trim(),
        notes: values.notes.trim(),
        photos,
      };
      try {
        if (animalId) await updateAnimal(animalId, payload);
        else await addAnimal(payload);
        router.back();
      } catch {
        Alert.alert('Error', 'Failed to save animal. Please try again.');
      }
    },
    [animalId, addAnimal, updateAnimal, photos]
  );

  const onDelete = useCallback(() => {
    if (!animalId) return;
    Alert.alert('Delete Animal', 'This will permanently delete this animal.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAnimal(animalId);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete animal.');
          }
        },
      },
    ]);
  }, [animalId, deleteAnimal]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title={isEditing ? 'Edit Animal' : 'Add Animal'} leftAction={{ icon: 'close', onPress: () => router.back() }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Select
            label="Tag number *"
            placeholder="Choose a tag"
            options={TAG_NUMBER_PRESETS.map((t) => ({ label: t, value: t }))}
            value={watch('tagNumber')}
            onChange={(v) => setValue('tagNumber', v, { shouldValidate: true })}
            allowCustom
            error={errors.tagNumber?.message}
          />
          <Input label="Name" placeholder="e.g. Daisy" error={errors.name?.message} {...register('name')} />
          <Select
            label="Species *"
            placeholder="Choose a species"
            options={SPECIES_OPTIONS.map((s) => ({ label: s, value: s }))}
            value={watch('species')}
            onChange={(v) => setValue('species', v, { shouldValidate: true })}
            allowCustom
            error={errors.species?.message}
          />
          <Select
            label="Breed"
            placeholder="Choose a breed"
            options={breedOptions}
            value={watch('breed')}
            onChange={(v) => setValue('breed', v, { shouldValidate: true })}
            allowCustom
            error={errors.breed?.message}
          />
          <DateField
            label="Birth date (YYYY-MM-DD)"
            value={watch('birthDate')}
            onChange={(v) => setValue('birthDate', v, { shouldValidate: true })}
            error={errors.birthDate?.message}
            maximumDate={today()}
          />
          <ChipSelect
            label="Sex"
            options={SEX_OPTIONS}
            value={watch('sex')}
            onChange={(value) => setValue('sex', value as 'male' | 'female', { shouldValidate: true })}
            error={errors.sex?.message}
          />
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Select
                label="Weight"
                placeholder="Choose"
                options={weightOptions}
                value={watch('weight')}
                onChange={(v) => setValue('weight', v, { shouldValidate: true })}
                allowCustom
                error={errors.weight?.message}
              />
            </View>
            <View style={styles.rowItem}>
              <Select
                label="Weight unit"
                placeholder="kg"
                options={WEIGHT_UNITS.map((u) => ({ label: u, value: u }))}
                value={watch('weightUnit')}
                onChange={(v) => setValue('weightUnit', v, { shouldValidate: true })}
                allowCustom
                error={errors.weightUnit?.message}
              />
            </View>
          </View>
          <ChipSelect
            label="Status"
            options={STATUS_OPTIONS}
            value={watch('status')}
            onChange={(value) => setValue('status', value as AnimalStatus, { shouldValidate: true })}
            error={errors.status?.message}
          />
          <Select
            label="Location"
            placeholder="Choose a location"
            options={LOCATIONS.map((l) => ({ label: l, value: l }))}
            value={watch('location')}
            onChange={(v) => setValue('location', v, { shouldValidate: true })}
            allowCustom
            error={errors.location?.message}
          />
          <TextArea label="Notes" placeholder="Optional notes..." error={errors.notes?.message} {...register('notes')} />
          <PhotoPicker photos={photos} onChange={setPhotos} />
          <Button
            title={isEditing ? 'Save Changes' : 'Add Animal'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            style={styles.submit}
          />
          {isEditing && (
            <Button title="Delete Animal" variant="danger" onPress={onDelete} fullWidth style={styles.deleteButton} />
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
    row: { flexDirection: 'row', gap: spacing.md },
    rowItem: { flex: 1 },
    submit: { marginTop: spacing.sm },
    deleteButton: { marginTop: spacing.md },
  });
