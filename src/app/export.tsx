import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { typography, spacing, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { EXPORT_DATASETS, ExportDataset, exportDatasetCsv, exportAllToXlsx, getExportFileName } from '../services/export';

function ExportRow({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.row} padding={spacing.md} onPress={onPress}>
      <View style={styles.iconTile}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowHint}>Export as CSV</Text>
      </View>
      <Icon name="share-outline" size={18} color={colors.textTertiary} />
    </Card>
  );
}

export default function ExportScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [exporting, setExporting] = useState<ExportDataset | null>(null);
  const [exportingAll, setExportingAll] = useState(false);

  const onExport = useCallback(async (dataset: ExportDataset) => {
    setExporting(dataset);
    try {
      const result = await exportDatasetCsv(dataset);
      Alert.alert('Export Complete', `${result.fileName} (${Math.max(1, Math.round(result.sizeBytes / 1024))} KB) saved.`);
    } catch (error) {
      Alert.alert('Export Failed', error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setExporting(null);
    }
  }, []);

  const onExportAll = useCallback(async () => {
    setExportingAll(true);
    try {
      const result = await exportAllToXlsx();
      Alert.alert('Export Complete', `${result.fileName} (${Math.max(1, Math.round(result.sizeBytes / 1024))} KB) saved.`);
    } catch (error) {
      Alert.alert('Export Failed', error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setExportingAll(false);
    }
  }, []);

  if (exporting || exportingAll) {
    const fileName = exporting ? getExportFileName(exporting) : 'anitrack-all-data.xlsx';
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Header
          title="Export Data"
          subtitle="Download any dataset as CSV"
          leftAction={{ icon: 'close', onPress: () => router.back() }}
        />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Preparing {fileName}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header
        title="Export Data"
        subtitle="Download any dataset as CSV"
        leftAction={{ icon: 'close', onPress: () => router.back() }}
      />
      <FlatList
        data={EXPORT_DATASETS}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => <ExportRow label={item.label} icon={item.icon} onPress={() => onExport(item.key)} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Card
            style={[styles.excelCard, { backgroundColor: colors.primary }]}
            padding={spacing.lg}
            onPress={onExportAll}
          >
            <View style={styles.excelIconTile}>
              <Icon name="grid-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.excelContent}>
              <Text style={styles.excelTitle}>Export Everything</Text>
              <Text style={styles.excelHint}>All datasets in one Excel (.xlsx) file</Text>
            </View>
            <Icon name="share-outline" size={18} color={colors.white} />
          </Card>
        }
        ListFooterComponent={
          <Text style={styles.note}>
            CSV files open in Excel, Google Sheets, and most spreadsheet apps. Use "Export Everything" for a single
            workbook with one sheet per dataset.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    list: { padding: spacing.lg },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    iconTile: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.primaryFaded,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rowContent: { flex: 1 },
    rowLabel: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
    rowHint: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    excelCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    excelIconTile: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.white,
      justifyContent: 'center',
      alignItems: 'center',
    },
    excelContent: { flex: 1 },
    excelTitle: { ...typography.body, color: colors.white, fontWeight: '700' },
    excelHint: { ...typography.caption, color: colors.white, opacity: 0.85, marginTop: 2 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
    loadingText: { ...typography.bodySmall, color: colors.textSecondary },
    note: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
  });

