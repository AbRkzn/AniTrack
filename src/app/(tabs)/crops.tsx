import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCropsStore } from '../../store/cropsStore';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { FAB } from '../../components/ui/FAB';
import { colors, typography, spacing, borderRadius } from '../../constants/theme';
import { getGrowthProgress, formatDate, getStatusColor } from '../../utils/helpers';
import { Crop } from '../../types';

function CropCard({ crop }: { crop: Crop }) {
  const progress = getGrowthProgress(crop.plantingDate, crop.expectedHarvestDate);

  return (
    <Card style={styles.cropCard} padding={spacing.lg}>
      <View style={styles.cropHeader}>
        <View style={styles.cropInfo}>
          <Text style={styles.cropName}>{crop.name}</Text>
          <Text style={styles.cropVariety}>{crop.variety || 'No variety'}</Text>
        </View>
        <StatusBadge status={crop.status} />
      </View>
      <View style={styles.cropDetails}>
        <Text style={styles.cropDetail}>?? {crop.fieldLocation || 'No location'}</Text>
        <Text style={styles.cropDetail}>?? Planted: {formatDate(crop.plantingDate, 'MMM dd, yyyy')}</Text>
        <Text style={styles.cropDetail}>?? Harvest: {formatDate(crop.expectedHarvestDate, 'MMM dd, yyyy')}</Text>
      </View>
      <ProgressBar
        progress={progress}
        color={getStatusColor(crop.status)}
        label="Growth Progress"
        showPercentage
      />
    </Card>
  );
}

export default function CropsScreen() {
  const crops = useCropsStore((s) => s.crops.data);
  const isLoading = useCropsStore((s) => s.crops.isLoading);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Crops" subtitle={${crops.length} total} />
      <View style={styles.container}>
        {crops.length === 0 && !isLoading ? (
          <EmptyState
            title="No Crops Added Yet"
            message="Start tracking your crops by adding your first one."
            icon="??"
            action={<FAB icon="+" onPress={() => {}} label="Add Crop" />}
          />
        ) : (
          <FlatList
            data={crops}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CropCard crop={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
        {crops.length > 0 && <FAB icon="+" onPress={() => {}} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.surface },
  container: { flex: 1, backgroundColor: colors.light.background },
  list: { padding: spacing.lg },
  cropCard: { marginBottom: spacing.md },
  cropHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  cropInfo: { flex: 1 },
  cropName: { ...typography.h4, color: colors.light.textPrimary },
  cropVariety: { ...typography.bodySmall, color: colors.light.textSecondary, marginTop: 2 },
  cropDetails: { marginBottom: spacing.md, gap: spacing.xs },
  cropDetail: { ...typography.bodySmall, color: colors.light.textSecondary },
});
