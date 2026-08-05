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
  Keyboard,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnimalHealthStore } from '../store/animalHealthStore';
import { Header } from '../components/ui/Header';
import { Input, TextArea } from '../components/ui/Input';
import { DateField } from '../components/ui/DateField';
import { ChipSelect } from '../components/ui/ChipSelect';
import { Button } from '../components/ui/Button';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { AnimalHealthType, AnimalHealthFormData } from '../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const TYPE_OPTIONS: { label: string; value: AnimalHealthType }[] = [
  { label: 'Examination', value: 'examination' },
  { label: 'Vaccination', value: 'vaccination' },
  { label: 'Treatment', value: 'treatment' },
  { label: 'Surgery', value: 'surgery' },
];

const healthRecordSchema = z.object({
  date: z.string().regex(DATE_RE, 'Use YYYY-MM-DD'),
  type: z.enum(['examination', 'vaccination', 'treatment', 'surgery']),
  diagnosis: z.string(),
  medication: z.string(),
  dosage: z.string(),
  veterinarian: z.string(),
  cost: z.string().refine((v) => v.trim() === '' || !Number.isNaN(Number(v)), 'Enter a valid number'),
  notes: z.string(),
});

type HealthRecordFormValues = z.infer<typeof healthRecordSchema>;

const today = () => new Date().toISOString().split('T')[0];

export default function HealthRecordFormScreen() {
  const { id, animalId: animalIdParam } = useLocalSearchParams<{ id?: string; animalId?: string }>();
  const recordId = typeof id === 'string' && id ? id : undefined;
  const animalId = typeof animalIdParam === 'string' && animalIdParam ? animalIdParam : undefined;
  const isEditing = !!recordId;

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { addRecord, updateRecord, deleteRecord, getRecordById } = useAnimalHealthStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HealthRecordFormValues>({
    resolver: zodResolver(healthRecordSchema),
    defaultValues: {
      date: today(),
      type: 'examination',
      diagnosis: '',
      medication: '',
      dosage: '',
      veterinarian: '',
      cost: '',
      notes: '',
    },
  });

  const [loading, setLoading] = useState(isEditing);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    let mounted = true;
    (async () => {
      const record = await getRecordById(recordId);
      if (!mounted) return;
      if (record) {
        reset({
          date: record.date,
          type: record.type,
          diagnosis: record.diagnosis ?? '',
          medication: record.medication ?? '',
          dosage: record.dosage ?? '',
          veterinarian: record.veterinarian ?? '',
          cost: record.cost != null ? String(record.cost) : '',
          notes: record.notes ?? '',
        });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isEditing, recordId, getRecordById, reset]);

  const onSubmit = useCallback(
    async (values: HealthRecordFormValues) => {
      if (!animalId) {
        Alert.alert('Error', 'Missing animal reference.');
        return;
      }
      const payload: AnimalHealthFormData = {
        animalId,
        date: values.date,
        type: values.type,
        diagnosis: values.diagnosis.trim() || undefined,
        medication: values.medication.trim() || undefined,
        dosage: values.dosage.trim() || undefined,
        veterinarian: values.veterinarian.trim() || undefined,
        cost: values.cost.trim() === '' ? undefined : Number(values.cost),
        notes: values.notes.trim(),
      };
      try {
        if (recordId) await updateRecord(recordId, payload);
        else await addRecord(payload);
        router.back();
      } catch {
        Alert.alert('Error', 'Failed to save health record. Please try again.');
      }
    },
    [recordId, animalId, addRecord, updateRecord]
  );

  const onDelete = useCallback(() => {
    if (!recordId) return;
    Alert.alert('Delete Record', 'This will permanently delete this health record.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecord(recordId);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete health record.');
          }
        },
      },
    ]);
  }, [recordId, deleteRecord]);

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
        title={isEditing ? 'Edit Health Record' : 'Add Health Record'}
        leftAction={{ icon: 'close', onPress: () => router.back() }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, Platform.OS === 'android' && { paddingBottom: spacing.xxxl + keyboardHeight }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <DateField
            label="Date *"
            value={watch('date')}
            onChange={(v) => setValue('date', v, { shouldValidate: true })}
            error={errors.date?.message}
            maximumDate={today()}
          />
          <ChipSelect
            label="Record type"
            options={TYPE_OPTIONS}
            value={watch('type')}
            onChange={(value) => setValue('type', value as AnimalHealthType, { shouldValidate: true })}
            error={errors.type?.message}
          />
          <Input
            label="Diagnosis"
            placeholder="e.g. Foot and mouth"
            error={errors.diagnosis?.message}
            {...register('diagnosis')}
          />
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Input
                label="Medication"
                placeholder="e.g. Oxytetracycline"
                error={errors.medication?.message}
                {...register('medication')}
              />
            </View>
            <View style={styles.rowItem}>
              <Input
                label="Dosage"
                placeholder="e.g. 10ml"
                error={errors.dosage?.message}
                {...register('dosage')}
              />
            </View>
          </View>
          <Input
            label="Veterinarian"
            placeholder="e.g. Dr. Santos"
            error={errors.veterinarian?.message}
            {...register('veterinarian')}
          />
          <Input
            label="Cost"
            placeholder="0.00"
            keyboardType="decimal-pad"
            error={errors.cost?.message}
            {...register('cost')}
          />
          <TextArea label="Notes" placeholder="Optional notes..." error={errors.notes?.message} {...register('notes')} />
          <Button
            title={isEditing ? 'Save Changes' : 'Add Record'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            style={styles.submit}
          />
          {isEditing && (
            <Button title="Delete Record" variant="danger" onPress={onDelete} fullWidth style={styles.deleteButton} />
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
