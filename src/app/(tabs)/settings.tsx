import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../../store/appStore';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { ChipSelect } from '../../components/ui/ChipSelect';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Icon, IconName } from '../../components/ui/Icon';
import { typography, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { seedSampleData, clearAppData } from '../../database/seed';
import { shareDatabaseBackup, importDatabaseBackup } from '../../services/backup';
import { AppSettings } from '../../types';

const THEME_OPTIONS = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

const CURRENCY_OPTIONS = [
  { label: 'PHP', value: 'PHP' },
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
  { label: 'KES', value: 'KES' },
  { label: 'NGN', value: 'NGN' },
  { label: 'ZAR', value: 'ZAR' },
  { label: 'INR', value: 'INR' },
  { label: 'AUD', value: 'AUD' },
];

const UNIT_OPTIONS = [
  { label: 'Metric', value: 'metric' },
  { label: 'Imperial', value: 'imperial' },
];

interface SettingRowProps {
  label: string;
  value?: string;
  icon: IconName;
  right?: React.ReactNode;
  onPress?: () => void;
}

function SettingRow({ label, value, icon, right, onPress }: SettingRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card style={styles.settingRow} padding={spacing.md} onPress={onPress}>
      <View style={styles.settingIconTile}>
        <Icon name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {right}
    </Card>
  );
}

interface StepperProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

function Stepper({ value, min = 0, max = 100, step = 1, onChange }: StepperProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={[styles.stepperButton, value <= min && styles.stepperButtonDisabled]}
        onPress={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        activeOpacity={0.7}
      >
        <Icon name="remove" size={18} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{value}</Text>
      <TouchableOpacity
        style={[styles.stepperButton, value >= max && styles.stepperButtonDisabled]}
        onPress={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        activeOpacity={0.7}
      >
        <Icon name="add" size={18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const isOnline = useAppStore((s) => s.isOnline);
  const reminderText = `${settings.reminderDaysBeforeHarvest} days before`;
  const backupText = `Every ${settings.backupIntervalDays} days`;
  const [latText, setLatText] = useState(String(settings.farmLatitude));
  const [lonText, setLonText] = useState(String(settings.farmLongitude));

  const onLoadSampleData = useCallback(() => {
    Alert.alert('Load Sample Data', 'This will replace all current data with sample data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Load Sample Data',
        style: 'destructive',
        onPress: async () => {
          try {
            await seedSampleData();
            Alert.alert('Done', 'Sample data loaded.');
          } catch {
            Alert.alert('Error', 'Failed to load sample data.');
          }
        },
      },
    ]);
  }, []);

  const onClearAllData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all crops, harvests, expenses, and fertilizer records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAppData();
              Alert.alert('Done', 'All data cleared.');
            } catch {
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
        },
      ]
    );
  }, []);

  const onExportBackup = useCallback(() => {
    Alert.alert('Export Backup', 'Create a backup file of all your data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export',
        onPress: async () => {
          try {
            const result = await shareDatabaseBackup();
            Alert.alert('Backup Created', `${result.fileName} (${Math.max(1, Math.round(result.sizeBytes / 1024))} KB)`);
          } catch {
            Alert.alert('Error', 'Failed to create backup.');
          }
        },
      },
    ]);
  }, []);

  const onImportBackup = useCallback(() => {
    Alert.alert(
      'Import Backup',
      'This will replace all current data with the selected backup file. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await importDatabaseBackup();
              if (result.restored) {
                Alert.alert('Restored', 'Backup restored. Restart the app to load the restored data.');
              }
            } catch {
              Alert.alert('Error', 'Failed to restore backup.');
            }
          },
        },
      ]
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Settings"
        leftAction={{ icon: 'arrow-back', onPress: () => router.back() }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Card style={styles.appearanceCard}>
          <Text style={styles.fieldLabel}>Theme</Text>
          <ChipSelect
            options={THEME_OPTIONS}
            value={settings.theme}
            onChange={(value) => updateSettings({ theme: value as AppSettings['theme'] })}
          />
          <Text style={styles.fieldLabel}>Currency</Text>
          <ChipSelect
            options={CURRENCY_OPTIONS}
            value={settings.currency}
            onChange={(value) => updateSettings({ currency: value })}
          />
          <Text style={styles.fieldLabel}>Unit System</Text>
          <ChipSelect
            options={UNIT_OPTIONS}
            value={settings.unitSystem}
            onChange={(value) => updateSettings({ unitSystem: value as AppSettings['unitSystem'] })}
          />
        </Card>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card style={styles.sectionCard} padding={spacing.xs}>
          <SettingRow
            label="Push Notifications"
            icon="notifications-outline"
            right={
              <Switch
                value={settings.pushNotifications}
                onValueChange={(v) => updateSettings({ pushNotifications: v })}
                trackColor={{ true: colors.primary, false: colors.disabled }}
              />
            }
          />
          <SettingRow
            label="Harvest Reminder"
            value={reminderText}
            icon="alarm-outline"
            right={
              <Stepper
                value={settings.reminderDaysBeforeHarvest}
                onChange={(value) => updateSettings({ reminderDaysBeforeHarvest: value })}
                min={0}
                max={30}
              />
            }
          />
        </Card>

        <Text style={styles.sectionTitle}>Data</Text>
        <Card style={styles.sectionCard} padding={spacing.xs}>
          <SettingRow
            label="Auto Backup"
            icon="cloud-upload-outline"
            right={
              <Switch
                value={settings.autoBackup}
                onValueChange={(v) => updateSettings({ autoBackup: v })}
                trackColor={{ true: colors.primary, false: colors.disabled }}
              />
            }
          />
          <SettingRow
            label="Backup Interval"
            value={backupText}
            icon="repeat-outline"
            right={
              <Stepper
                value={settings.backupIntervalDays}
                onChange={(value) => updateSettings({ backupIntervalDays: value })}
                min={1}
                max={90}
              />
            }
          />
          <SettingRow
            label="Sync on WiFi Only"
            icon="wifi-outline"
            right={
              <Switch
                value={settings.syncOnWifiOnly}
                onValueChange={(v) => updateSettings({ syncOnWifiOnly: v })}
                trackColor={{ true: colors.primary, false: colors.disabled }}
              />
            }
          />
        </Card>

        <Card style={styles.sectionCard} padding={spacing.xs}>
          <SettingRow
            label="Export Backup"
            icon="share-outline"
            onPress={onExportBackup}
          />
          <SettingRow
            label="Import Backup"
            icon="file-tray-outline"
            onPress={onImportBackup}
          />
          <SettingRow
            label="Export Data (CSV)"
            icon="download-outline"
            onPress={() => router.push('/export')}
          />
        </Card>

        <Text style={styles.sectionTitle}>Weather</Text>
        <Card style={styles.locationCard} padding={spacing.md}>
          <Input
            label="Farm Location Name"
            leftIcon="map-outline"
            placeholder="e.g. Nueva Ecija, Philippines"
            value={settings.farmLocationName}
            onChangeText={(text) => updateSettings({ farmLocationName: text })}
          />
          <Input
            label="Farm Latitude"
            leftIcon="location-outline"
            keyboardType="decimal-pad"
            placeholder="-90 to 90"
            value={latText}
            onChangeText={(text) => {
              setLatText(text);
              const n = parseFloat(text);
              if (!Number.isNaN(n) && n >= -90 && n <= 90) {
                updateSettings({ farmLatitude: n });
              }
            }}
          />
          <Input
            label="Farm Longitude"
            leftIcon="compass-outline"
            keyboardType="decimal-pad"
            placeholder="-180 to 180"
            value={lonText}
            onChangeText={(text) => {
              setLonText(text);
              const n = parseFloat(text);
              if (!Number.isNaN(n) && n >= -180 && n <= 180) {
                updateSettings({ farmLongitude: n });
              }
            }}
          />
        </Card>
        <Text style={styles.sectionNote}>Weather syncs automatically whenever the app comes online.</Text>

        <Button title="Load Sample Data" variant="outline" fullWidth onPress={onLoadSampleData} style={styles.dataButton} />
        <Button title="Clear All Data" variant="danger" fullWidth onPress={onClearAllData} style={styles.dataButton} />

        <Text style={styles.sectionTitle}>About</Text>
        <Card style={styles.sectionCard} padding={spacing.xs}>
          <SettingRow label="App Version" value="1.0.0" icon="phone-portrait-outline" />
          <SettingRow
            label="Offline Status"
            value={isOnline ? 'Online' : 'Offline'}
            icon="cloud-offline-outline"
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    sectionTitle: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.lg },
    sectionCard: { padding: 0, overflow: 'hidden' },
    appearanceCard: { padding: spacing.md, overflow: 'hidden' },
    settingRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    settingIconTile: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.primaryFaded,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    settingContent: { flex: 1 },
    settingLabel: { ...typography.body, color: colors.textPrimary },
    settingValue: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    fieldLabel: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.md, marginBottom: spacing.xs },
    locationCard: { marginBottom: spacing.sm },
    sectionNote: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.sm },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    stepperButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepperButtonDisabled: { opacity: 0.4 },
    stepperValue: { minWidth: 28, textAlign: 'center', ...typography.body, fontWeight: '600', color: colors.textPrimary },
    dataButton: { marginTop: spacing.md },
  });
