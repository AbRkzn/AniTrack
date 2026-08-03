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
import { ChipSelect } from '../components/ui/ChipSelect';
import { Button } from '../components/ui/Button';
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
        photos: [],
      };
      try {
        if (animalId) await updateAnimal(animalId, payload);
        else await addAnimal(payload);
        router.back();
      } catch {
        Alert.alert('Error', 'Failed to save animal. Please try again.');
      }
    },
    [animalId, addAnimal, updateAnimal]
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
          <Input
            label="Tag number *"
            placeholder="e.g. A-001"
            error={errors.tagNumber?.message}
            {...register('tagNumber')}
          />
          <Input label="Name" placeholder="e.g. Daisy" error={errors.name?.message} {...register('name')} />
          <Input
            label="Species *"
            placeholder="e.g. Cattle"
            error={errors.species?.message}
            {...register('species')}
          />
          <Input label="Breed" placeholder="e.g. Brahman" error={errors.breed?.message} {...register('breed')} />
          <Input
            label="Birth date (YYYY-MM-DD)"
            placeholder="2024-03-15"
            error={errors.birthDate?.message}
            {...register('birthDate')}
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
              <Input
                label="Weight"
                placeholder="0"
                keyboardType="numeric"
                error={errors.weight?.message}
                {...register('weight')}
              />
            </View>
            <View style={styles.rowItem}>
              <Input
                label="Weight unit"
                placeholder="kg"
                error={errors.weightUnit?.message}
                {...register('weightUnit')}
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
          <Input label="Location" placeholder="e.g. Barn 2" error={errors.location?.message} {...register('location')} />
          <TextArea label="Notes" placeholder="Optional notes..." error={errors.notes?.message} {...register('notes')} />
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
