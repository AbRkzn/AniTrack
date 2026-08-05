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
import { useAnimalProductStore } from '../store/animalProductStore';
import { Header } from '../components/ui/Header';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { DateField } from '../components/ui/DateField';
import { Button } from '../components/ui/Button';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { AnimalProductType, AnimalProductFormData } from '../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const PRODUCT_TYPES: { label: string; value: AnimalProductType }[] = [
  { label: 'Eggs', value: 'eggs' },
  { label: 'Milk', value: 'milk' },
  { label: 'Wool', value: 'wool' },
  { label: 'Meat', value: 'meat' },
  { label: 'Honey', value: 'honey' },
  { label: 'Manure', value: 'manure' },
  { label: 'Other', value: 'other' },
];

const UNITS = ['pcs', 'dozen', 'pieces', 'kg', 'grams', 'liters', 'trays', 'bottles'];

const animalProductSchema = z.object({
  productType: z.enum(['eggs', 'milk', 'wool', 'meat', 'honey', 'manure', 'other']),
  date: z.string().regex(DATE_RE, 'Use YYYY-MM-DD'),
  quantity: z.string().refine(
    (v) => v.trim() !== '' && !Number.isNaN(Number(v)) && Number(v) > 0,
    'Enter a valid quantity'
  ),
  unit: z.string().min(1, 'Unit is required'),
  sellingPrice: z.string().refine((v) => v.trim() === '' || !Number.isNaN(Number(v)), 'Enter a valid number'),
  revenue: z.string().refine((v) => v.trim() === '' || !Number.isNaN(Number(v)), 'Enter a valid number'),
  buyer: z.string(),
  notes: z.string(),
});

type AnimalProductFormValues = z.infer<typeof animalProductSchema>;

const today = () => new Date().toISOString().split('T')[0];

export default function AnimalProductFormScreen() {
  const { id, animalId: animalIdParam } = useLocalSearchParams<{ id?: string; animalId?: string }>();
  const productId = typeof id === 'string' && id ? id : undefined;
  const animalId = typeof animalIdParam === 'string' && animalIdParam ? animalIdParam : undefined;
  const isEditing = !!productId;

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { addProduct, updateProduct, deleteProduct, getProductById } = useAnimalProductStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnimalProductFormValues>({
    resolver: zodResolver(animalProductSchema),
    defaultValues: {
      productType: 'eggs',
      date: today(),
      quantity: '',
      unit: 'pcs',
      sellingPrice: '',
      revenue: '',
      buyer: '',
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
      const record = await getProductById(productId);
      if (!mounted) return;
      if (record) {
        reset({
          productType: record.productType,
          date: record.date,
          quantity: String(record.quantity),
          unit: record.unit,
          sellingPrice: record.sellingPrice != null && record.sellingPrice > 0 ? String(record.sellingPrice) : '',
          revenue: record.revenue != null && record.revenue > 0 ? String(record.revenue) : '',
          buyer: record.buyer ?? '',
          notes: record.notes ?? '',
        });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isEditing, productId, getProductById, reset]);

  const onSubmit = useCallback(
    async (values: AnimalProductFormValues) => {
      if (!animalId) {
        Alert.alert('Error', 'Missing animal reference.');
        return;
      }
      const payload: AnimalProductFormData = {
        animalId,
        productType: values.productType,
        date: values.date,
        quantity: Number(values.quantity),
        unit: values.unit.trim() || 'pcs',
        sellingPrice: values.sellingPrice.trim() === '' ? undefined : Number(values.sellingPrice),
        revenue: values.revenue.trim() === '' ? undefined : Number(values.revenue),
        buyer: values.buyer.trim() || undefined,
        notes: values.notes.trim(),
      };
      try {
        if (productId) await updateProduct(productId, payload);
        else await addProduct(payload);
        router.back();
      } catch {
        Alert.alert('Error', 'Failed to save product record. Please try again.');
      }
    },
    [productId, animalId, addProduct, updateProduct]
  );

  const onDelete = useCallback(() => {
    if (!productId) return;
    Alert.alert('Delete Product', 'This will permanently delete this product record.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(productId);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete product record.');
          }
        },
      },
    ]);
  }, [productId, deleteProduct]);

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
        title={isEditing ? 'Edit Product' : 'Log Product'}
        leftAction={{ icon: 'close', onPress: () => router.back() }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, Platform.OS === 'android' && { paddingBottom: spacing.xxxl * 2 + keyboardHeight }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Select
            label="Product type *"
            placeholder="Choose a product"
            options={PRODUCT_TYPES.map((p) => ({ label: p.label, value: p.value }))}
            value={watch('productType')}
            onChange={(v) => setValue('productType', v as AnimalProductType, { shouldValidate: true })}
            error={errors.productType?.message}
          />
          <DateField
            label="Date *"
            value={watch('date')}
            onChange={(v) => setValue('date', v, { shouldValidate: true })}
            error={errors.date?.message}
            maximumDate={today()}
          />
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Input
                label="Quantity *"
                placeholder="0"
                keyboardType="numeric"
                error={errors.quantity?.message}
                {...register('quantity')}
              />
            </View>
            <View style={styles.rowItem}>
              <Select
                label="Unit *"
                placeholder="Choose a unit"
                options={UNITS.map((u) => ({ label: u, value: u }))}
                value={watch('unit')}
                onChange={(v) => setValue('unit', v, { shouldValidate: true })}
                allowCustom
                error={errors.unit?.message}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Input
                label="Selling price / unit"
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={errors.sellingPrice?.message}
                {...register('sellingPrice')}
              />
            </View>
            <View style={styles.rowItem}>
              <Input
                label="Revenue"
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={errors.revenue?.message}
                {...register('revenue')}
              />
            </View>
          </View>
          <Input label="Buyer" placeholder="e.g. Market stall" error={errors.buyer?.message} {...register('buyer')} />
          <TextArea label="Notes" placeholder="Optional notes..." error={errors.notes?.message} {...register('notes')} />
          <Button
            title={isEditing ? 'Save Changes' : 'Add Product'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            style={styles.submit}
          />
          {isEditing && (
            <Button title="Delete Product" variant="danger" onPress={onDelete} fullWidth style={styles.deleteButton} />
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
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl * 2 },
    row: { flexDirection: 'row', gap: spacing.md },
    rowItem: { flex: 1 },
    submit: { marginTop: spacing.sm },
    deleteButton: { marginTop: spacing.md },
  });
