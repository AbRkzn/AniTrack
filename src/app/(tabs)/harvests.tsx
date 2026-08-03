import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useHarvestsStore } from '../../store/harvestsStore';
import { useAppStore } from '../../store/appStore';
import { Header } from '../../components/ui/Header';
import { Card, StatCard } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { FAB } from '../../components/ui/FAB';
import { typography, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { Harvest } from '../../types';

function HarvestCard({ harvest, onPress, onLongPress }: { harvest: Harvest; onPress: () => void; onLongPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currency = useAppStore((s) => s.settings.currency);
  return (
    <Card style={styles.harvestCard} padding={spacing.lg} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.harvestHeader}>
        <Text style={styles.harvestDate}>{formatDate(harvest.harvestDate, 'MMM dd, yyyy')}</Text>
      </View>
      <View style={styles.harvestDetails}>
        <Text style={styles.harvestDetail}>Quantity: {harvest.quantity} {harvest.unit}</Text>
        {harvest.quality && <Text style={styles.harvestDetail}>Quality: {harvest.quality}</Text>}
        {harvest.buyer && <Text style={styles.harvestDetail}>Buyer: {harvest.buyer}</Text>}
        {(harvest.revenue ?? 0) > 0 && (
          <Text style={[styles.harvestDetail, { color: colors.primary, fontWeight: '600' }]}>
            Revenue: {formatCurrency(harvest.revenue ?? 0, currency)}
          </Text>
        )}
      </View>
      {harvest.notes ? <Text style={styles.harvestNotes}>{harvest.notes}</Text> : null}
    </Card>
  );
}

export default function HarvestsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const harvests = useHarvestsStore((s) => s.harvests.data);
  const isLoading = useHarvestsStore((s) => s.harvests.isLoading);
  const error = useHarvestsStore((s) => s.harvests.error);
  const fetchHarvests = useHarvestsStore((s) => s.fetchHarvests);
  const deleteHarvest = useHarvestsStore((s) => s.deleteHarvest);
  const currency = useAppStore((s) => s.settings.currency);
  const totalQuantity = harvests.reduce((sum, h) => sum + h.quantity, 0);
  const totalRevenue = harvests.reduce((sum, h) => sum + (h.revenue || 0), 0);
  const subtitle = `${harvests.length} records`;
  const quantityValue = `${totalQuantity} kg`;

  useFocusEffect(
    useCallback(() => {
      fetchHarvests();
    }, [fetchHarvests])
  );

  const confirmDelete = useCallback(
    (harvest: Harvest) => {
      Alert.alert('Delete Harvest', `Delete the harvest from ${formatDate(harvest.harvestDate)}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHarvest(harvest.id);
            } catch {
              Alert.alert('Error', 'Failed to delete harvest.');
            }
          },
        },
      ]);
    },
    [deleteHarvest]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Harvests" subtitle={subtitle} />
      <View style={styles.container}>
        <View style={styles.summaryRow}>
          <StatCard title="Total Harvested" value={quantityValue} icon="basket-outline" style={styles.summaryCard} />
          <StatCard title="Revenue" value={formatCurrency(totalRevenue, currency)} icon="cash-outline" color={colors.primary} style={styles.summaryCard} />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {harvests.length === 0 && !isLoading ? (
          <EmptyState
            title="No Harvest Records"
            message="Log your first harvest to start tracking yields."
            icon="basket-outline"
          />
        ) : (
          <FlatList
            data={harvests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <HarvestCard
                harvest={item}
                onPress={() => router.push(`/harvest-form?id=${item.id}`)}
                onLongPress={() => confirmDelete(item)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchHarvests}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}
        <FAB icon="add" onPress={() => router.push('/harvest-form')} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    summaryRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
    summaryCard: { flex: 1 },
    list: { padding: spacing.lg, paddingTop: 0 },
    harvestCard: { marginBottom: spacing.md },
    harvestHeader: { marginBottom: spacing.sm },
    harvestDate: { ...typography.h4, color: colors.textPrimary },
    harvestDetails: { gap: spacing.xs, marginBottom: spacing.sm },
    harvestDetail: { ...typography.bodySmall, color: colors.textSecondary },
    harvestNotes: { ...typography.caption, color: colors.textTertiary, fontStyle: 'italic' },
    errorText: {
      ...typography.caption,
      color: colors.error,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
    },
  });
