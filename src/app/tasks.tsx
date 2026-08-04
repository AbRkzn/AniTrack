import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTaskStore } from '../store/taskStore';
import { useCropsStore } from '../store/cropsStore';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ChipSelect } from '../components/ui/ChipSelect';
import { EmptyState } from '../components/ui/EmptyState';
import { FAB } from '../components/ui/FAB';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { formatDate, getStatusLabel } from '../utils/helpers';
import { FarmTask, TaskStatus } from '../types';
import { useTaskReminders } from '../hooks/useTaskReminders';

const STATUS_OPTIONS = [
  { label: 'All', value: '__all__' },
  { label: 'Pending', value: 'pending', activeColor: '#1565C0', activeBackgroundColor: '#E3F2FD' },
  { label: 'In Progress', value: 'in_progress', activeColor: '#F9A825', activeBackgroundColor: '#FFF8E1' },
  { label: 'Completed', value: 'completed', activeColor: '#2E7D32', activeBackgroundColor: '#E8F5E9' },
  { label: 'Cancelled', value: 'cancelled', activeColor: '#D32F2F', activeBackgroundColor: '#FFEBEE' },
];

function getPriorityColor(priority: FarmTask['priority'], colors: ColorScheme): string {
  if (priority === 'high') return colors.error;
  if (priority === 'medium') return colors.warning;
  return colors.success;
}

function TaskCard({
  task,
  cropName,
  onPress,
  onToggle,
  onLongPress,
}: {
  task: FarmTask;
  cropName: string;
  onPress: () => void;
  onToggle: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDone = task.status === 'completed';

  return (
    <Card style={[styles.card, isDone && styles.cardDone]} padding={spacing.lg} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.cardHeader}>
        <TouchableToggle onPress={onToggle} done={isDone} />
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, isDone && styles.cardTitleDone]}>{task.title}</Text>
          <Text style={styles.cardMeta}>
            {getStatusLabel(task.category)}
            {task.priority !== 'medium' ? ` · ${task.priority} priority` : ''}
            {cropName ? ` · ${cropName}` : ''}
          </Text>
        </View>
        <StatusBadge status={task.status} />
      </View>
      {task.description ? <Text style={styles.cardDescription} numberOfLines={2}>{task.description}</Text> : null}
      <View style={styles.cardFooter}>
        <View style={styles.dueRow}>
          <Icon name="time-outline" size={13} color={isOverdue(task) ? colors.error : colors.textTertiary} />
          <Text style={[styles.dueText, isOverdue(task) && { color: colors.error }]}>
            {formatDate(task.dueDate, 'MMM dd, yyyy')}
          </Text>
        </View>
        {task.reminderEnabled && task.reminderDate ? (
          <View style={styles.dueRow}>
            <Icon name="notifications-outline" size={13} color={colors.warning} />
            <Text style={styles.dueText}>{formatDate(task.reminderDate, 'MMM dd, yyyy')}</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function isOverdue(task: FarmTask): boolean {
  if (task.status === 'completed' || task.status === 'cancelled') return false;
  return task.dueDate < new Date().toISOString().split('T')[0];
}

function TouchableToggle({ onPress, done }: { onPress: () => void; done: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View
      style={[styles.toggle, done && { backgroundColor: colors.primary, borderColor: colors.primary }]}
      onTouchEnd={onPress}
    >
      {done && <Icon name="checkmark" size={14} color={colors.white} />}
    </View>
  );
}

export default function TasksScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tasks = useTaskStore((s) => s.tasks.data);
  const isLoading = useTaskStore((s) => s.tasks.isLoading);
  const error = useTaskStore((s) => s.tasks.error);
  const filters = useTaskStore((s) => s.filters);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const toggleTaskStatus = useTaskStore((s) => s.toggleTaskStatus);
  const setFilters = useTaskStore((s) => s.setFilters);
  const crops = useCropsStore((s) => s.crops.data);
  const fetchCrops = useCropsStore((s) => s.fetchCrops);

  useTaskReminders();

  const cropNameById = useCallback(
    (id: string) => crops.find((c) => c.id === id)?.name ?? 'Unknown crop',
    [crops]
  );

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      fetchCrops();
    }, [fetchTasks, fetchCrops])
  );

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const overdueCount = tasks.filter((t) => t.status === 'pending' && isOverdue(t)).length;

  const visibleTasks = useMemo(() => {
    if (!filters.status) return tasks;
    return tasks.filter((t) => t.status === filters.status);
  }, [tasks, filters.status]);

  const confirmDelete = useCallback(
    (task: FarmTask) => {
      Alert.alert('Delete Task', `Delete "${task.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
            } catch {
              Alert.alert('Error', 'Failed to delete task.');
            }
          },
        },
      ]);
    },
    [deleteTask]
  );

  const onToggle = useCallback(
    (task: FarmTask) => {
      if (task.status === 'completed') {
        toggleTaskStatus(task.id, 'pending').catch(() => {});
      } else {
        toggleTaskStatus(task.id, 'completed').catch(() => {});
      }
    },
    [toggleTaskStatus]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Farm Tasks"
        subtitle={`${pendingCount} pending${overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}`}
        leftAction={{ icon: 'arrow-back', onPress: () => router.back() }}
      />
      <View style={styles.container}>
        <View style={styles.filterWrap}>
          <ChipSelect
            options={STATUS_OPTIONS}
            value={filters.status || '__all__'}
            onChange={(value) => setFilters(value === '__all__' ? { status: undefined } : { status: value as TaskStatus })}
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {tasks.length === 0 && !isLoading ? (
          <EmptyState
            title="No Tasks Yet"
            message="Plan your farm work by adding to-do tasks like watering, planting, or pest control."
            icon="checkmark-done-outline"
            action={
              <Button title="Add a task" variant="outline" onPress={() => router.push('/task-form')} />
            }
          />
        ) : (
          <FlatList
            data={visibleTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                cropName={item.cropId ? cropNameById(item.cropId) : ''}
                onPress={() => router.push(`/task-form?id=${item.id}`)}
                onToggle={() => onToggle(item)}
                onLongPress={() => confirmDelete(item)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchTasks}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}
        <FAB icon="add" onPress={() => router.push('/task-form')} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    filterWrap: { padding: spacing.lg, paddingBottom: 0 },
    list: { padding: spacing.lg },
    card: { marginBottom: spacing.md },
    cardDone: { opacity: 0.7 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
    toggle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardInfo: { flex: 1 },
    cardTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    cardTitleDone: { textDecorationLine: 'line-through', color: colors.textTertiary },
    cardMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    cardDescription: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    dueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    dueText: { ...typography.caption, color: colors.textTertiary },
    errorText: {
      ...typography.caption,
      color: colors.error,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
  });
