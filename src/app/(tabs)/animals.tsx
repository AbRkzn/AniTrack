import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { differenceInCalendarMonths } from 'date-fns';
import { useAnimalsStore } from '../../store/animalsStore';
import { useAnimalProductStore } from '../../store/animalProductStore';
import { useAppStore } from '../../store/appStore';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { FAB } from '../../components/ui/FAB';
import { Icon } from '../../components/ui/Icon';
import { PhotoStrip } from '../../components/ui/PhotoStrip';
import { typography, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { formatCurrency, formatNumber } from '../../utils/helpers';
import { Animal } from '../../types';

function getAgeLabel(birthDate?: string): string {
  if (!birthDate) return '';
  const totalMonths = differenceInCalendarMonths(new Date(), new Date(birthDate));
  if (totalMonths <= 0) return 'Newborn';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years > 0) {
    return months > 0 ? `${years} yr ${months} mo` : `${years} yr${years > 1 ? 's' : ''}`;
  }
  return `${months} mo`;
}

function AnimalCard({
  animal,
  currency,
  summary,
  onPress,
  onLongPress,
}: {
  animal: Animal;
  currency: string;
  summary?: { revenue: number; count: number };
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const displayName = animal.name || animal.tagNumber;
  const ageLabel = getAgeLabel(animal.birthDate);

  return (
    <Card style={styles.animalCard} padding={spacing.lg} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.animalHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryFaded }]}>
          <Icon name="paw-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.animalInfo}>
          <Text style={styles.animalName}>{displayName}</Text>
          <Text style={styles.animalTag}>
            {animal.tagNumber}
            {animal.breed ? ` · ${animal.breed}` : ''}
          </Text>
        </View>
        <StatusBadge status={animal.status} />
      </View>
      <View style={styles.animalDetails}>
        <Text style={styles.animalDetail}>Species: {animal.species}</Text>
        <Text style={styles.animalDetail}>Sex: {animal.sex === 'male' ? 'Male' : 'Female'}</Text>
      </View>
      <View style={styles.animalDetails}>
        {animal.weight != null && (
          <Text style={styles.animalDetail}>
            Weight: {formatNumber(animal.weight, 0)} {animal.weightUnit}
          </Text>
        )}
        {ageLabel !== '' && <Text style={styles.animalDetail}>Age: {ageLabel}</Text>}
      </View>
      {summary && summary.count > 0 && (
        <View style={styles.productSummary}>
          <Icon name="egg-outline" size={14} color={colors.primary} />
          <Text style={styles.productSummaryText}>
            Production: {formatCurrency(summary.revenue, currency)} · {summary.count}{' '}
            {summary.count === 1 ? 'product' : 'products'}
          </Text>
        </View>
      )}
      <PhotoStrip photos={animal.photos} />
    </Card>
  );
}

export default function AnimalsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const animals = useAnimalsStore((s) => s.animals.data);
  const isLoading = useAnimalsStore((s) => s.animals.isLoading);
  const error = useAnimalsStore((s) => s.animals.error);
  const fetchAnimals = useAnimalsStore((s) => s.fetchAnimals);
  const deleteAnimal = useAnimalsStore((s) => s.deleteAnimal);
  const products = useAnimalProductStore((s) => s.products.data);
  const fetchAllProducts = useAnimalProductStore((s) => s.fetchAllProducts);
  const currency = useAppStore((s) => s.settings.currency);
  const activeCount = animals.filter((a) => a.status === 'active').length;
  const subtitle = `${animals.length} total · ${activeCount} active`;

  const productSummary = useMemo(() => {
    const map = new Map<string, { revenue: number; count: number }>();
    for (const p of products) {
      const entry = map.get(p.animalId) ?? { revenue: 0, count: 0 };
      entry.revenue += p.revenue || 0;
      entry.count += 1;
      map.set(p.animalId, entry);
    }
    return map;
  }, [products]);

  useFocusEffect(
    useCallback(() => {
      fetchAnimals();
      fetchAllProducts();
    }, [fetchAnimals, fetchAllProducts])
  );

  const confirmDelete = useCallback(
    (animal: Animal) => {
      Alert.alert('Delete Animal', `Delete "${animal.name || animal.tagNumber}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnimal(animal.id);
            } catch {
              Alert.alert('Error', 'Failed to delete animal.');
            }
          },
        },
      ]);
    },
    [deleteAnimal]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Livestock" subtitle={subtitle} />
      <View style={styles.container}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {animals.length === 0 && !isLoading ? (
          <EmptyState
            title="No Animals Added Yet"
            message="Start tracking your livestock by adding your first animal."
            icon="paw-outline"
          />
        ) : (
          <FlatList
            data={animals}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AnimalCard
                animal={item}
                currency={currency}
                summary={productSummary.get(item.id)}
                onPress={() => router.push(`/animal-detail?id=${item.id}`)}
                onLongPress={() => confirmDelete(item)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchAnimals}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}
        <FAB icon="add" onPress={() => router.push('/animal-form')} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.lg },
    animalCard: { marginBottom: spacing.md },
    animalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    animalInfo: { flex: 1, marginRight: spacing.sm },
    animalName: { ...typography.h4, color: colors.textPrimary },
    animalTag: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    animalDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.sm },
    animalDetail: { ...typography.bodySmall, color: colors.textSecondary },
    productSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primaryFaded,
      borderRadius: 8,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.sm,
      alignSelf: 'flex-start',
    },
    productSummaryText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
    errorText: {
      ...typography.caption,
      color: colors.error,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
  });
