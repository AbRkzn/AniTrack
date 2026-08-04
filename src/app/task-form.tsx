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
import { useTaskStore } from '../store/taskStore';
import { useCropsStore } from '../store/cropsStore';
import { useFieldsStore } from '../store/fieldsStore';
import { Header } from '../components/ui/Header';
import { Input, TextArea } from '../components/ui/Input';
import { ChipSelect } from '../components/ui/ChipSelect';
import { Button } from '../components/ui/Button';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { FarmTask, TaskCategory, TaskPriority, TaskStatus } from '../types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const CATEGORY_OPTIONS: { label: string; value: TaskCategory }[] = [
  { label: 'Planting', value: 'planting' },
  { label: 'Watering', value: 'watering' },
  { label: 'Fertilizing', value: 'fertilizing' },
  { label: 'Pest Control', value: 'pest_control' },
  { label: 'Harvesting', value: 'harvesting' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Administrative', value: 'administrative' },
  { label: 'Other', value: 'other' },
];

const PRIORITY_OPTIONS: { label: string; value: TaskPriority }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

const STATUS_OPTIONS: { label: string; value: TaskStatus; activeColor: string; activeBackgroundColor: string }[] = [
  { label: 'Pending', value: 'pending', activeColor: '#1565C0', activeBackgroundColor: '#E3F2FD' },
  { label: 'In Progress', value: 'in_progress', activeColor: '#F9A825', activeBackgroundColor: '#FFF8E1' },
  { label: 'Completed', value: 'completed', activeColor: '#2E7D32', activeBackgroundColor: '#E8F5E9' },
];

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  category: z.enum(['planting', 'watering', 'fertilizing', 'pest_control', 'harvesting', 'maintenance', 'administrative', 'other']),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  dueDate: z.string().regex(DATE_RE, 'Use YYYY-MM-DD'),
  cropId: z.string(),
  fieldId: z.string(),
  assignedTo: z.string(),
  reminderEnabled: z.boolean(),
  reminderDate: z.string().refine((v) => v.trim() === '' || DATE_RE.test(v), 'Use YYYY-MM-DD'),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const NONE = '__none__';
const today = () => new Date().toISOString().split('T')[0];

export default function TaskFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const taskId = typeof id === 'string' && id ? id : undefined;
  const isEditing = !!taskId;

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { addTask, updateTask, deleteTask, getTaskById } = useTaskStore();
  const crops = useCropsStore((s) => s.crops.data);
  const fetchCrops = useCropsStore((s) => s.fetchCrops);
  const fields = useFieldsStore((s) => s.fields.data);
  const fetchFields = useFieldsStore((s) => s.fetchFields);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'other',
      priority: 'medium',
      status: 'pending',
      dueDate: today(),
      cropId: NONE,
      fieldId: NONE,
      assignedTo: '',
      reminderEnabled: false,
      reminderDate: '',
    },
  });

  const reminderEnabled = watch('reminderEnabled');

  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (crops.length === 0) fetchCrops();
    if (fields.length === 0) fetchFields();
  }, [crops.length, fields.length, fetchCrops, fetchFields]);

  useEffect(() => {
    if (!isEditing) return;
    let mounted = true;
    (async () => {
      const task = await getTaskById(taskId);
      if (!mounted) return;
      if (task) {
        reset({
          title: task.title,
          description: task.description ?? '',
          category: task.category,
          priority: task.priority,
          status: task.status,
          dueDate: task.dueDate,
          cropId: task.cropId || NONE,
          fieldId: task.fieldId || NONE,
          assignedTo: task.assignedTo ?? '',
          reminderEnabled: task.reminderEnabled,
          reminderDate: task.reminderDate ?? '',
        });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isEditing, taskId, getTaskById, reset]);

  const onSubmit = useCallback(
    async (values: TaskFormValues) => {
      const payload: Omit<FarmTask, 'id' | 'createdAt' | 'updatedAt'> = {
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        priority: values.priority,
        status: values.status,
        dueDate: values.dueDate,
        cropId: values.cropId && values.cropId !== NONE ? values.cropId : undefined,
        fieldId: values.fieldId && values.fieldId !== NONE ? values.fieldId : undefined,
        assignedTo: values.assignedTo.trim() || undefined,
        reminderEnabled: values.reminderEnabled,
        reminderDate: values.reminderEnabled && values.reminderDate.trim() ? values.reminderDate.trim() : undefined,
      };
      try {
        if (taskId) await updateTask(taskId, payload);
        else await addTask(payload);
        router.back();
      } catch {
        Alert.alert('Error', 'Failed to save task. Please try again.');
      }
    },
    [taskId, addTask, updateTask]
  );

  const onDelete = useCallback(() => {
    if (!taskId) return;
    Alert.alert('Delete Task', 'This will permanently delete this task.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(taskId);
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete task.');
          }
        },
      },
    ]);
  }, [taskId, deleteTask]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const cropOptions = [{ label: 'None', value: NONE }, ...crops.map((c) => ({ label: c.name, value: c.id }))];
  const fieldOptions = [{ label: 'None', value: NONE }, ...fields.map((f) => ({ label: f.name, value: f.id }))];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header
        title={isEditing ? 'Edit Task' : 'Add Task'}
        leftAction={{ icon: 'close', onPress: () => router.back() }}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Input label="Title *" placeholder="e.g. Water the rice paddies" error={errors.title?.message} {...register('title')} />
          <TextArea label="Description" placeholder="Optional details..." error={errors.description?.message} {...register('description')} />
          <ChipSelect
            label="Category"
            options={CATEGORY_OPTIONS}
            value={watch('category')}
            onChange={(value) => setValue('category', value as TaskCategory, { shouldValidate: true })}
            error={errors.category?.message}
          />
          <ChipSelect
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={watch('priority')}
            onChange={(value) => setValue('priority', value as TaskPriority, { shouldValidate: true })}
            error={errors.priority?.message}
          />
          <ChipSelect
            label="Status"
            options={STATUS_OPTIONS}
            value={watch('status')}
            onChange={(value) => setValue('status', value as TaskStatus, { shouldValidate: true })}
            error={errors.status?.message}
          />
          <Input
            label="Due date (YYYY-MM-DD) *"
            placeholder="2026-08-02"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />
          <ChipSelect
            label="Linked crop (optional)"
            options={cropOptions}
            value={watch('cropId')}
            onChange={(value) => setValue('cropId', value, { shouldValidate: true })}
          />
          <ChipSelect
            label="Linked field (optional)"
            options={fieldOptions}
            value={watch('fieldId')}
            onChange={(value) => setValue('fieldId', value, { shouldValidate: true })}
          />
          <Input
            label="Assigned to"
            placeholder="e.g. Farmhand"
            error={errors.assignedTo?.message}
            {...register('assignedTo')}
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Set a reminder</Text>
            <Controller
              control={control}
              name="reminderEnabled"
              render={({ field }) => (
                <Switch
                  value={field.value}
                  onValueChange={field.onChange}
                  trackColor={{ true: colors.primary }}
                />
              )}
            />
          </View>
          {reminderEnabled && (
            <Input
              label="Reminder date (YYYY-MM-DD)"
              placeholder="2026-08-01"
              error={errors.reminderDate?.message}
              {...register('reminderDate')}
            />
          )}
          <Button
            title={isEditing ? 'Save Changes' : 'Add Task'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            style={styles.submit}
          />
          {isEditing && (
            <Button title="Delete Task" variant="danger" onPress={onDelete} fullWidth style={styles.deleteButton} />
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
