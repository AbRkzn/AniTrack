import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useFieldsStore } from '../store/fieldsStore';
import { useCropsStore } from '../store/cropsStore';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { FAB } from '../components/ui/FAB';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { formatNumber } from '../utils/helpers';
import { Field } from '../types';

function FieldCard({
  field,
  cropCount,
  onPress,
  onLongPress,
}: {
  field: Field;
  cropCount: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.card} padding={spacing.lg} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.cardHeader}>
        <View style={styles.iconTile}>
          <Icon name="map-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{field.name}</Text>
          <Text style={styles.cardSubtitle}>
            {formatNumber(field.acreage)} ha
            {field.soilType ? ` · ${field.soilType}` : ''}
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Icon name="leaf-outline" size={13} color={colors.textTertiary} />
          <Text style={styles.footerText}>{cropCount} crop{cropCount === 1 ? '' : 's'}</Text>
        </View>
        {field.notes ? (
          <Text style={styles.notes} numberOfLines={1}>{field.notes}</Text>
        ) : null}
      </View>
    </Card>
  );
}

export default function FieldsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fields = useFieldsStore((s) => s.fields.data);
  const isLoading = useFieldsStore((s) => s.fields.isLoading);
  const error = useFieldsStore((s) => s.fields.error);
  const fetchFields = useFieldsStore((s) => s.fetchFields);
  const deleteField = useFieldsStore((s) => s.deleteField);
  const crops = useCropsStore((s) => s.crops.data);
  const fetchCrops = useCropsStore((s) => s.fetchCrops);

  const cropCountByField = useMemo(() => {
    const map: Record<string, number> = {};
    for (const crop of crops) {
      if (crop.fieldId) map[crop.fieldId] = (map[crop.fieldId] || 0) + 1;
    }
    return map;
  }, [crops]);

  useFocusEffect(
    useCallback(() => {
      fetchFields();
      fetchCrops();
    }, [fetchFields, fetchCrops])
  );

  const totalAcreage = fields.reduce((sum, f) => sum + f.acreage, 0);

  const confirmDelete = useCallback(
    (field: Field) => {
      Alert.alert(
        'Delete Field',
        `Delete "${field.name}"? Crops planted there will keep their field location text but no longer be linked to this field.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteField(field.id);
              } catch {
                Alert.alert('Error', 'Failed to delete field.');
              }
            },
          },
        ]
      );
    },
    [deleteField]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Land Fields"
        subtitle={`${fields.length} field${fields.length === 1 ? '' : 's'} · ${formatNumber(totalAcreage)} ha total`}
        leftAction={{ icon: 'arrow-back', onPress: () => router.back() }}
      />
      <View style={styles.container}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {fields.length === 0 && !isLoading ? (
          <EmptyState
            title="No Fields Yet"
            message="Divide your farm into fields or parcels, then assign crops to each one."
            icon="map-outline"
            action={<Button title="Add a field" variant="outline" onPress={() => router.push('/field-form')} />}
          />
        ) : (
          <FlatList
            data={fields}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FieldCard
                field={item}
                cropCount={cropCountByField[item.id] || 0}
                onPress={() => router.push(`/field-form?id=${item.id}`)}
                onLongPress={() => confirmDelete(item)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchFields}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        )}
        <FAB icon="add" onPress={() => router.push('/field-form')} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.lg },
    card: { marginBottom: spacing.md },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconTile: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.primaryFaded,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardInfo: { flex: 1 },
    cardTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
    cardSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderLight,
      paddingTop: spacing.sm,
    },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    footerText: { ...typography.caption, color: colors.textTertiary },
    notes: { ...typography.caption, color: colors.textTertiary, flex: 1, textAlign: 'right' },
    errorText: {
      ...typography.caption,
      color: colors.error,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
  });
