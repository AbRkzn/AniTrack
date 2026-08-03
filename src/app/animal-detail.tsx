import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  RefreshControl,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { differenceInCalendarMonths } from 'date-fns';
import { useAnimalsStore } from '../store/animalsStore';
import { useAnimalHealthStore } from '../store/animalHealthStore';
import { useAppStore } from '../store/appStore';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { FAB } from '../components/ui/FAB';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { typography, spacing, ColorScheme, borderRadius } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { formatDate, formatCurrency, formatNumber } from '../utils/helpers';
import { Animal, AnimalHealthRecord } from '../types';

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

function InfoRow({ label, value }: { label: string; value?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function HealthRecordCard({ record, onPress, onLongPress }: { record: AnimalHealthRecord; onPress: () => void; onLongPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currency = useAppStore((s) => s.settings.currency);

  return (
    <Card style={styles.recordCard} padding={spacing.lg} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.recordHeader}>
        <StatusBadge status={record.type} />
        <Text style={styles.recordDate}>{formatDate(record.date, 'MMM dd, yyyy')}</Text>
      </View>
      {record.diagnosis && <Text style={styles.recordTitle}>{record.diagnosis}</Text>}
      {record.medication && (
        <Text style={styles.recordDetail}>
          Meds: {record.medication}
          {record.dosage ? ` · ${record.dosage}` : ''}
        </Text>
      )}
      {record.veterinarian && <Text style={styles.recordDetail}>Vet: {record.veterinarian}</Text>}
      {record.cost != null && record.cost > 0 && (
        <Text style={[styles.recordDetail, { color: colors.primary, fontWeight: '600' }]}>
          Cost: {formatCurrency(record.cost, currency)}
        </Text>
      )}
      {record.notes ? <Text style={styles.recordNotes}>{record.notes}</Text> : null}
    </Card>
  );
}

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const animalId = typeof id === 'string' && id ? id : undefined;

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currency = useAppStore((s) => s.settings.currency);

  const { getAnimalById, deleteAnimal } = useAnimalsStore();
  const records = useAnimalHealthStore((s) => s.records.data);
  const isLoadingRecords = useAnimalHealthStore((s) => s.records.isLoading);
  const recordsError = useAnimalHealthStore((s) => s.records.error);
  const fetchRecords = useAnimalHealthStore((s) => s.fetchRecords);
  const deleteRecord = useAnimalHealthStore((s) => s.deleteRecord);

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loadingAnimal, setLoadingAnimal] = useState(!!animalId);

  useFocusEffect(
    useCallback(() => {
      if (!animalId) return;
      let mounted = true;
      (async () => {
        const result = await getAnimalById(animalId);
        if (mounted) setAnimal(result);
        setLoadingAnimal(false);
        await fetchRecords(animalId);
      })();
      return () => {
        mounted = false;
      };
    }, [animalId, getAnimalById, fetchRecords])
  );

  const confirmDeleteAnimal = useCallback(() => {
    if (!animalId) return;
    Alert.alert('Delete Animal', 'This will permanently delete this animal and its health records.', [
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

  const confirmDeleteRecord = useCallback(
    (record: AnimalHealthRecord) => {
      Alert.alert('Delete Record', 'This will permanently delete this health record.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecord(record.id);
            } catch {
              Alert.alert('Error', 'Failed to delete health record.');
            }
          },
        },
      ]);
    },
    [deleteRecord]
  );

  if (loadingAnimal) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!animal) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Animal" leftAction={{ icon: 'chevron-back', onPress: () => router.back() }} />
        <View style={styles.centerContainer}>
          <Text style={styles.missingText}>Animal not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ageLabel = getAgeLabel(animal.birthDate);
  const photoUri = animal.photos?.[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title={animal.name || animal.tagNumber}
        subtitle={animal.species}
        leftAction={{ icon: 'chevron-back', onPress: () => router.back() }}
        rightAction={{ icon: 'create-outline', onPress: () => router.push(`/animal-form?id=${animal.id}`) }}
      />
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HealthRecordCard
            record={item}
            onPress={() => router.push(`/health-record-form?id=${item.id}&animalId=${animal.id}`)}
            onLongPress={() => confirmDeleteRecord(item)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingRecords}
            onRefresh={() => fetchRecords(animal.id)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            <Card padding={spacing.lg} style={styles.infoCard}>
              <View style={styles.animalHeader}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.primaryFaded }]}>
                    <Icon name="paw-outline" size={24} color={colors.primary} />
                  </View>
                )}
                <View style={styles.animalInfo}>
                  <Text style={styles.animalName}>{animal.name || animal.tagNumber}</Text>
                  <Text style={styles.animalTag}>
                    {animal.tagNumber}
                    {animal.breed ? ` · ${animal.breed}` : ''}
                  </Text>
                </View>
                <StatusBadge status={animal.status} />
              </View>
              <View style={styles.divider} />
              <InfoRow label="Species" value={animal.species} />
              <InfoRow label="Sex" value={animal.sex === 'male' ? 'Male' : 'Female'} />
              <InfoRow
                label="Weight"
                value={animal.weight != null ? `${formatNumber(animal.weight, 0)} ${animal.weightUnit}` : undefined}
              />
              <InfoRow label="Age" value={ageLabel || undefined} />
              <InfoRow label="Location" value={animal.location} />
              {animal.notes ? <Text style={styles.notes}>{animal.notes}</Text> : null}
              <Button title="Delete Animal" variant="danger" onPress={confirmDeleteAnimal} fullWidth style={styles.deleteButton} />
            </Card>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Health Records</Text>
              <Text style={styles.sectionCount}>{records.length}</Text>
            </View>
            {recordsError && <Text style={styles.errorText}>{recordsError}</Text>}
          </View>
        }
        ListEmptyComponent={
          !isLoadingRecords && !recordsError ? (
            <EmptyState
              title="No Health Records"
              message="Add a vaccination, treatment, or examination record for this animal."
              icon="medkit-outline"
            />
          ) : null
        }
      />
      <FAB icon="add" onPress={() => router.push(`/health-record-form?animalId=${animal.id}`)} />
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    missingText: { ...typography.body, color: colors.textSecondary },
    list: { padding: spacing.lg },
    infoCard: { marginBottom: spacing.lg },
    animalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    avatarImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: spacing.md,
      backgroundColor: colors.surfaceVariant,
    },
    animalInfo: { flex: 1, marginRight: spacing.sm },
    animalName: { ...typography.h3, color: colors.textPrimary },
    animalTag: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginBottom: spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    infoLabel: { ...typography.bodySmall, color: colors.textSecondary },
    infoValue: { ...typography.bodySmall, color: colors.textPrimary, fontWeight: '600' },
    notes: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.md,
      padding: spacing.md,
    },
    deleteButton: { marginTop: spacing.lg },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    sectionTitle: { ...typography.h4, color: colors.textPrimary },
    sectionCount: { ...typography.bodySmall, color: colors.textSecondary },
    recordCard: { marginBottom: spacing.md },
    recordHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    recordDate: { ...typography.caption, color: colors.textSecondary },
    recordTitle: { ...typography.bodySmall, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
    recordDetail: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 2 },
    recordNotes: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.sm,
      padding: spacing.sm,
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
  });
