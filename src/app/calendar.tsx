import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { useTaskStore } from '../store/taskStore';
import { useHarvestsStore } from '../store/harvestsStore';
import { useCropsStore } from '../store/cropsStore';
import { useAnimalsStore } from '../store/animalsStore';
import { useAnimalHealthStore } from '../store/animalHealthStore';
import { useAnimalProductStore } from '../store/animalProductStore';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { Icon, IconName } from '../components/ui/Icon';
import { typography, spacing, borderRadius, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { FarmTask, Harvest, Crop, AnimalHealthRecord, AnimalProduct } from '../types';
import { getStatusLabel, formatNumber } from '../utils/helpers';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

type CalendarEvent =
  | { type: 'task'; task: FarmTask }
  | { type: 'harvest'; harvest: Harvest }
  | { type: 'planting'; crop: Crop }
  | { type: 'expected_harvest'; crop: Crop }
  | { type: 'health'; record: AnimalHealthRecord }
  | { type: 'product'; product: AnimalProduct };

function dayKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export default function CalendarScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: windowWidth } = useWindowDimensions();
  const cellWidth = (windowWidth - spacing.lg * 2 - spacing.md * 2) / 7;

  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => dayKey(new Date()));

  const tasks = useTaskStore((s) => s.tasks.data);
  const harvests = useHarvestsStore((s) => s.harvests.data);
  const crops = useCropsStore((s) => s.crops.data);
  const animals = useAnimalsStore((s) => s.animals.data);
  const records = useAnimalHealthStore((s) => s.records.data);
  const products = useAnimalProductStore((s) => s.products.data);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  const fetchHarvests = useHarvestsStore((s) => s.fetchHarvests);
  const fetchCrops = useCropsStore((s) => s.fetchCrops);
  const fetchAnimals = useAnimalsStore((s) => s.fetchAnimals);
  const fetchAllRecords = useAnimalHealthStore((s) => s.fetchAllRecords);
  const fetchAllProducts = useAnimalProductStore((s) => s.fetchAllProducts);
  const tasksLoading = useTaskStore((s) => s.tasks.isLoading);
  const harvestsLoading = useHarvestsStore((s) => s.harvests.isLoading);
  const cropsLoading = useCropsStore((s) => s.crops.isLoading);
  const recordsLoading = useAnimalHealthStore((s) => s.records.isLoading);
  const productsLoading = useAnimalProductStore((s) => s.products.isLoading);
  const isLoading = tasksLoading || harvestsLoading || cropsLoading || recordsLoading || productsLoading;

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
      fetchHarvests();
      fetchCrops();
      fetchAnimals();
      fetchAllRecords();
      fetchAllProducts();
    }, [fetchTasks, fetchHarvests, fetchCrops, fetchAnimals, fetchAllRecords, fetchAllProducts])
  );

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    const push = (date: string, event: CalendarEvent) => {
      if (!map[date]) map[date] = [];
      map[date].push(event);
    };
    for (const task of tasks) {
      if (task.dueDate) push(task.dueDate, { type: 'task', task });
    }
    for (const harvest of harvests) {
      push(harvest.harvestDate, { type: 'harvest', harvest });
    }
    for (const crop of crops) {
      if (crop.plantingDate) push(crop.plantingDate, { type: 'planting', crop });
      if (crop.expectedHarvestDate) push(crop.expectedHarvestDate, { type: 'expected_harvest', crop });
    }
    for (const record of records) {
      push(record.date, { type: 'health', record });
    }
    for (const product of products) {
      push(product.date, { type: 'product', product });
    }
    return map;
  }, [tasks, harvests, crops, records, products]);

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
    const days: Date[] = [];
    for (let i = 0; i < 42; i += 1) {
      days.push(addDays(start, i));
    }
    return days;
  }, [viewDate]);

  const today = new Date();
  const selectedEvents = eventsByDay[selectedDate] || [];
  const animalNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const animal of animals) {
      map.set(animal.id, animal.name || animal.tagNumber);
    }
    return map;
  }, [animals]);

  const goPrev = () => setViewDate((d) => subMonths(d, 1));
  const goNext = () => setViewDate((d) => addMonths(d, 1));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Calendar"
        subtitle={format(viewDate, 'MMMM yyyy')}
        leftAction={{ icon: 'arrow-back', onPress: () => router.back() }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => { fetchTasks(); fetchHarvests(); fetchCrops(); fetchAnimals(); fetchAllRecords(); fetchAllProducts(); }} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        <Card padding={spacing.md}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goPrev} style={styles.navButton} hitSlop={8}>
              <Icon name="chevron-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{format(viewDate, 'MMMM yyyy')}</Text>
            <TouchableOpacity onPress={goNext} style={styles.navButton} hitSlop={8}>
              <Icon name="chevron-forward" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((weekday) => (
              <Text key={weekday} style={[styles.weekday, { width: cellWidth }]}>
                {weekday}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {gridDays.map((day) => {
              const key = dayKey(day);
              const inMonth = isSameMonth(day, viewDate);
              const isSelected = key === selectedDate;
              const isToday = isSameDay(day, today);
              const dayEvents = eventsByDay[key] || [];
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.dayCell,
                    { width: cellWidth },
                    isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => setSelectedDate(key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dayNumberWrap, isToday && styles.dayNumberToday]}>
                    <Text
                      style={[
                        styles.dayNumber,
                        !inMonth && styles.dayNumberMuted,
                        isToday && styles.dayNumberTodayText,
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                  </View>
                  <View style={styles.dotRow}>
                    {dayEvents.slice(0, 3).map((event, index) => (
                      <View
                        key={index}
                          style={[
                            styles.dot,
                            {
                              backgroundColor:
                                event.type === 'task' ? colors.chartTeal
                                : event.type === 'harvest' ? colors.warning
                                : event.type === 'planting' ? colors.chartBlue
                                : event.type === 'expected_harvest' ? colors.chartPurple
                                : event.type === 'health' ? colors.error
                                : colors.primary,
                            },
                          ]}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
          </Text>
          {selectedEvents.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="calendar-outline" size={28} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No events scheduled for this day.</Text>
            </View>
          ) : (
            <View>
              {selectedEvents.map((event, index) => (
                <EventRow key={index} event={event} colors={colors} animalNameById={animalNameById} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EventRow({
  event,
  colors,
  animalNameById,
}: {
  event: CalendarEvent;
  colors: ColorScheme;
  animalNameById: Map<string, string>;
}) {
  const styles = useMemo(() => createStyles(colors), [colors]);

  const meta = ((): { icon: IconName; color: string; title: string; subtitle: string; onPress: () => void } => {
    if (event.type === 'task') {
      return {
        icon: 'checkmark-done-outline',
        color: colors.chartTeal,
        title: event.task.title,
        subtitle: `Task · ${event.task.status.replace(/_/g, ' ')}`,
        onPress: () => router.push(`/task-form?id=${event.task.id}`),
      };
    }
    if (event.type === 'harvest') {
      return {
        icon: 'basket-outline',
        color: colors.warning,
        title: `Harvest: ${event.harvest.quantity} ${event.harvest.unit}`,
        subtitle: 'Harvest',
        onPress: () => router.push(`/harvest-form?id=${event.harvest.id}`),
      };
    }
    if (event.type === 'planting') {
      return {
        icon: 'leaf-outline',
        color: colors.chartBlue,
        title: `Planting: ${event.crop.name}`,
        subtitle: 'Crop planted',
        onPress: () => router.push(`/crop-form?id=${event.crop.id}`),
      };
    }
    if (event.type === 'expected_harvest') {
      return {
        icon: 'trending-up-outline',
        color: colors.chartPurple,
        title: `Expected harvest: ${event.crop.name}`,
        subtitle: 'Crop expected harvest',
        onPress: () => router.push(`/crop-form?id=${event.crop.id}`),
      };
    }
    if (event.type === 'health') {
      const animalName = animalNameById.get(event.record.animalId) || 'Animal';
      return {
        icon: 'medkit-outline',
        color: colors.error,
        title: event.record.diagnosis || getStatusLabel(event.record.type),
        subtitle: `${animalName} · Health · ${getStatusLabel(event.record.type)}`,
        onPress: () => router.push(`/health-record-form?id=${event.record.id}&animalId=${event.record.animalId}`),
      };
    }
    const animalName = animalNameById.get(event.product.animalId) || 'Animal';
    return {
      icon: 'egg-outline',
      color: colors.primary,
      title: `${formatNumber(event.product.quantity, 1)} ${event.product.unit} ${getStatusLabel(event.product.productType)}`,
      subtitle: `${animalName} · Product`,
      onPress: () => router.push(`/animal-product-form?id=${event.product.id}&animalId=${event.product.animalId}`),
    };
  })();

  return (
    <Card style={styles.eventRow} padding={spacing.md} onPress={meta.onPress}>
      <View style={[styles.eventIconTile, { backgroundColor: `rgba(${hexToRgb(meta.color)}, 0.12)` }]}>
        <Icon name={meta.icon} size={18} color={meta.color} />
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{meta.title}</Text>
        <Text style={styles.eventSubtitle}>{meta.subtitle}</Text>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
    </Card>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    navButton: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    monthTitle: { ...typography.h4, color: colors.textPrimary },
    weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
    weekday: {
      textAlign: 'center',
      ...typography.caption,
      fontWeight: '600',
      color: colors.textTertiary,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: {
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: borderRadius.md,
    },
    dayCellSelected: { backgroundColor: colors.primaryFaded },
    dayNumberWrap: {
      width: 26,
      height: 26,
      borderRadius: 13,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayNumberToday: { backgroundColor: colors.primary },
    dayNumber: { ...typography.bodySmall, color: colors.textPrimary },
    dayNumberMuted: { color: colors.textTertiary },
    dayNumberTodayText: { color: colors.white, fontWeight: '700' },
    dotRow: { flexDirection: 'row', gap: 2, height: 6, marginTop: 2 },
    dot: { width: 5, height: 5, borderRadius: 3 },
    section: { marginTop: spacing.xl },
    sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.md },
    emptyBox: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xxl,
    },
    emptyText: { ...typography.bodySmall, color: colors.textTertiary },
    eventRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    eventIconTile: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    eventContent: { flex: 1 },
    eventTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    eventSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  });
