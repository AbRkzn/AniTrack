import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFieldsStore } from '../store/fieldsStore';
import { Header } from '../components/ui/Header';
import { Input, TextArea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { Field } from '../types';

const fieldSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  acreage: z.string().refine((v) => v.trim() === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), 'Enter a valid area'),
  soilType: z.string(),
  notes: z.string(),
});

type FieldFormValues = z.infer<typeof fieldSchema>;

export default function FieldFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const fieldId = typeof id === 'string' && id ? id : undefined;
  const isEditing = !!fieldId;

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { addField, updateField, deleteField, getFieldById } = useFieldsStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FieldFormValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: { name: '', acreage: '', soilType: '', notes: '' },
  });

  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!isEditing) return;
    let mounted = true;
    (async () => {
      const field = await getFieldById(fieldId);
      if (!mounted) return;
      if (field) {
        reset({
          name: field.name,
          acreage: String(field.acreage ?? 0),
          soilType: field.soilType ?? '',
          notes: field.notes ?? '',
        });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isEditing, fieldId, getFieldById, reset]);

  const onSubmit = useCallback(
    async (values: FieldFormValues) => {
      const payload: Omit<Field, 'id' | 'createdAt' | 'updatedAt'> = {
        name: values.name.trim(),
        acreage: values.acreage.trim() === '' ? 0 : Number(values.acreage),
        soilType: values.soilType.trim() || undefined,
        notes: values.notes.trim(),
      };
      try {
        if (fieldId) await updateField(fieldId, payload);
        else await addField(payload);
        router.back();
      } catch {
        Alert.alert('Error', 'Failed to save field. Please try again.');
      }
    },
    [fieldId, addField, updateField]
  );

  const onDelete = useCallback(() => {
    if (!fieldId) return;
    Alert.alert('Delete Field', 'This will permanently delete this field.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteField(fieldId);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete field.');
          }
        },
      },
    ]);
  }, [fieldId, deleteField]);

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
        title={isEditing ? 'Edit Field' : 'Add Field'}
        leftAction={{ icon: 'close', onPress: () => router.back() }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Input label="Field name *" placeholder="e.g. North paddock" error={errors.name?.message} {...register('name')} />
          <Input
            label="Area (hectares)"
            placeholder="0.0"
            keyboardType="decimal-pad"
            error={errors.acreage?.message}
            {...register('acreage')}
          />
          <Input label="Soil type" placeholder="e.g. Clay loam" error={errors.soilType?.message} {...register('soilType')} />
          <TextArea label="Notes" placeholder="Optional notes..." error={errors.notes?.message} {...register('notes')} />
          <Button
            title={isEditing ? 'Save Changes' : 'Add Field'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            style={styles.submit}
          />
          {isEditing && (
            <Button title="Delete Field" variant="danger" onPress={onDelete} fullWidth style={styles.deleteButton} />
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
