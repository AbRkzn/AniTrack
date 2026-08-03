import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useFertilizerStore } from '../store/fertilizerStore';
import { useCropsStore } from '../store/cropsStore';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { FAB } from '../components/ui/FAB';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { formatDate, getStatusLabel } from '../utils/helpers';
import { FertilizerApplication } from '../types';

function FertilizerCard({
  application,
  cropName,
  onPress,
  onLongPress,
}: {
  application: FertilizerApplication;
  cropName: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.card} padding={spacing.lg} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{application.fertilizerName}</Text>
          <Text style={styles.cardCrop}>{cropName || 'Unknown crop'}</Text>
        </View>
        <StatusBadge status={application.status} />
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.cardDetail}>Type: {getStatusLabel(application.fertilizerType)}</Text>
        <Text style={styles.cardDetail}>Method: {getStatusLabel(application.applicationMethod)}</Text>
        <Text style={styles.cardDetail}>
          Amount: {application.amountPerUnit} {application.unit} per application
          {application.totalAmount > 0 ? ` · total ${application.totalAmount} ${application.unit}` : ''}
        </Text>
        <Text style={styles.cardDetail}>
          Scheduled: {formatDate(application.scheduledDate, 'MMM dd, yyyy')}
          {application.completedDate ? ` · done ${formatDate(application.completedDate, 'MMM dd, yyyy')}` : ''}
        </Text>
        {application.reminderEnabled && (
          <View style={styles.reminderRow}>
            <Icon name="notifications-outline" size={13} color={colors.warning} />
            <Text style={styles.cardDetail}>Reminder set</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

export default function FertilizersScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const applications = useFertilizerStore((s) => s.applications.data);
  const isLoading = useFertilizerStore((s) => s.applications.isLoading);
  const error = useFertilizerStore((s) => s.applications.error);
  const fetchApplications = useFertilizerStore((s) => s.fetchApplications);
  const deleteApplication = useFertilizerStore((s) => s.deleteApplication);
  const crops = useCropsStore((s) => s.crops.data);
  const fetchCrops = useCropsStore((s) => s.fetchCrops);

  const cropNameById = useCallback(
    (id: string) => crops.find((c) => c.id === id)?.name ?? 'Unknown crop',
    [crops]
  );

  useFocusEffect(
    useCallback(() => {
      fetchApplications();
      fetchCrops();
    }, [fetchApplications, fetchCrops])
  );

  const confirmDelete = useCallback(
    (application: FertilizerApplication) => {
      Alert.alert('Delete Application', `Delete "${application.fertilizerName}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteApplication(application.id);
            } catch {
              Alert.alert('Error', 'Failed to delete application.');
            }
          },
        },
      ]);
    },
    [deleteApplication]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Fertilizer"
        subtitle={`${applications.length} application${applications.length === 1 ? '' : 's'}`}
        leftAction={{ icon: 'arrow-back', onPress: () => router.back() }}
      />
      <View style={styles.container}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {applications.length === 0 && !isLoading ? (
          <EmptyState
            title="No Fertilizer Applications Yet"
            message="Schedule fertilizer applications for your crops and track when they're applied."
            icon="flask-outline"
            action={
              <Button
                title="Schedule an application"
                variant="outline"
                onPress={() => router.push('/fertilizer-form')}
              />
            }
          />
        ) : (
          <FlatList
            data={applications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FertilizerCard
                application={item}
                cropName={cropNameById(item.cropId)}
                onPress={() => router.push(`/fertilizer-form?id=${item.id}`)}
                onLongPress={() => confirmDelete(item)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchApplications}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}
        <FAB icon="add" onPress={() => router.push('/fertilizer-form')} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    card: { marginBottom: spacing.md },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
    cardInfo: { flex: 1 },
    cardTitle: { ...typography.h4, color: colors.textPrimary },
    cardCrop: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    cardDetails: { gap: spacing.xs },
    cardDetail: { ...typography.bodySmall, color: colors.textSecondary },
    reminderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    errorText: {
      ...typography.caption,
      color: colors.error,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
  });
