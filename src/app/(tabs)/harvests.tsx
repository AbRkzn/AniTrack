import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHarvestsStore } from '../../store/harvestsStore';
import { Header } from '../../components/ui/Header';
import { Card, StatCard } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FAB } from '../../components/ui/FAB';
import { colors, typography, spacing } from '../../constants/theme';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { Harvest } from '../../types';

function HarvestCard({ harvest }: { harvest: Harvest }) {
  return (
    <Card style={styles.harvestCard} padding={spacing.lg}>
      <View style={styles.harvestHeader}>
        <Text style={styles.harvestDate}>{formatDate(harvest.harvestDate, 'MMM dd, yyyy')}</Text>
      </View>
      <View style={styles.harvestDetails}>
        <Text style={styles.harvestDetail}>Quantity: {harvest.quantity} {harvest.unit}</Text>
        {harvest.quality && <Text style={styles.harvestDetail}>Quality: {harvest.quality}</Text>}
        {harvest.buyer && <Text style={styles.harvestDetail}>Buyer: {harvest.buyer}</Text>}
        {(harvest.revenue ?? 0) > 0 && (
          <Text style={[styles.harvestDetail, { color: colors.light.primary, fontWeight: '600' }]}>
            Revenue: {formatCurrency(harvest.revenue ?? 0)}
          </Text>
        )}
      </View>
      {harvest.notes ? <Text style={styles.harvestNotes}>{harvest.notes}</Text> : null}
    </Card>
  );
}

export default function HarvestsScreen() {
  const harvests = useHarvestsStore((s) => s.harvests.data);
  const isLoading = useHarvestsStore((s) => s.harvests.isLoading);
  const totalQuantity = harvests.reduce((sum, h) => sum + h.quantity, 0);
  const totalRevenue = harvests.reduce((sum, h) => sum + (h.revenue || 0), 0);
  const subtitle = `${harvests.length} records`;
  const quantityValue = `${totalQuantity} kg`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Harvests" subtitle={subtitle} />
      <View style={styles.container}>
        <View style={styles.summaryRow}>
          <StatCard title="Total Harvested" value={quantityValue} icon="🌾" style={styles.summaryCard} />
          <StatCard title="Revenue" value={formatCurrency(totalRevenue)} icon="💰" color={colors.light.primary} style={styles.summaryCard} />
        </View>
        {harvests.length === 0 && !isLoading ? (
          <EmptyState
            title="No Harvest Records"
            message="Log your first harvest to start tracking yields."
            icon="🌾"
          />
        ) : (
          <FlatList
            data={harvests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <HarvestCard harvest={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
        <FAB icon="+" onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.surface },
  container: { flex: 1, backgroundColor: colors.light.background },
  summaryRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  summaryCard: { flex: 1 },
  list: { padding: spacing.lg, paddingTop: 0 },
  harvestCard: { marginBottom: spacing.md },
  harvestHeader: { marginBottom: spacing.sm },
  harvestDate: { ...typography.h4, color: colors.light.textPrimary },
  harvestDetails: { gap: spacing.xs, marginBottom: spacing.sm },
  harvestDetail: { ...typography.bodySmall, color: colors.light.textSecondary },
  harvestNotes: { ...typography.caption, color: colors.light.textTertiary, fontStyle: 'italic' },
});