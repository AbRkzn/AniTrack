import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCropsStore } from '../../store/cropsStore';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { PhotoStrip } from '../../components/ui/PhotoStrip';
import { FAB } from '../../components/ui/FAB';
import { typography, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { getGrowthProgress, formatDate, getStatusColor } from '../../utils/helpers';
import { Crop } from '../../types';

function CropCard({ crop, onPress, onLongPress }: { crop: Crop; onPress: () => void; onLongPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const progress = getGrowthProgress(crop.plantingDate, crop.expectedHarvestDate);

  return (
    <Card style={styles.cropCard} padding={spacing.lg} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.cropHeader}>
        <View style={styles.cropInfo}>
          <Text style={styles.cropName}>{crop.name}</Text>
          <Text style={styles.cropVariety}>{crop.variety || 'No variety'}</Text>
        </View>
        <StatusBadge status={crop.status} />
      </View>
      <View style={styles.cropDetails}>
        <Text style={styles.cropDetail}>Planted: {formatDate(crop.plantingDate, 'MMM dd, yyyy')}</Text>
        <Text style={styles.cropDetail}>Harvest: {formatDate(crop.expectedHarvestDate, 'MMM dd, yyyy')}</Text>
      </View>
      <ProgressBar
        progress={progress}
        color={getStatusColor(crop.status)}
        label="Growth Progress"
        showPercentage
      />
      <PhotoStrip photos={crop.photos} />
    </Card>
  );
}

export default function CropsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const crops = useCropsStore((s) => s.crops.data);
  const isLoading = useCropsStore((s) => s.crops.isLoading);
  const error = useCropsStore((s) => s.crops.error);
  const fetchCrops = useCropsStore((s) => s.fetchCrops);
  const deleteCrop = useCropsStore((s) => s.deleteCrop);
  const subtitle = `${crops.length} total`;

  useFocusEffect(
    useCallback(() => {
      fetchCrops();
    }, [fetchCrops])
  );

  const confirmDelete = useCallback(
    (crop: Crop) => {
      Alert.alert('Delete Crop', `Delete "${crop.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCrop(crop.id);
            } catch {
              Alert.alert('Error', 'Failed to delete crop.');
            }
          },
        },
      ]);
    },
    [deleteCrop]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Crops" subtitle={subtitle} />
      <View style={styles.container}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {crops.length === 0 && !isLoading ? (
          <EmptyState
            title="No Crops Added Yet"
            message="Start tracking your crops by adding your first one."
            icon="leaf-outline"
          />
        ) : (
          <FlatList
            data={crops}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CropCard
                crop={item}
                onPress={() => router.push(`/crop-form?id=${item.id}`)}
                onLongPress={() => confirmDelete(item)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchCrops}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}
        <FAB icon="add" onPress={() => router.push('/crop-form')} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.lg },
    cropCard: { marginBottom: spacing.md },
    cropHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
    cropInfo: { flex: 1 },
    cropName: { ...typography.h4, color: colors.textPrimary },
    cropVariety: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    cropDetails: { marginBottom: spacing.md, gap: spacing.xs },
    cropDetail: { ...typography.bodySmall, color: colors.textSecondary },
    errorText: {
      ...typography.caption,
      color: colors.error,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
  });
