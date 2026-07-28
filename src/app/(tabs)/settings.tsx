import React from 'react';
import { View, Text, ScrollView, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/appStore';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { colors, typography, spacing } from '../../constants/theme';

interface SettingRowProps {
  label: string;
  value?: string;
  icon: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

function SettingRow({ label, value, icon, right, onPress }: SettingRowProps) {
  return (
    <Card style={styles.settingRow} padding={spacing.md} onPress={onPress}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {right}
    </Card>
  );
}

export default function SettingsScreen() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const isOnline = useAppStore((s) => s.isOnline);
  const reminderText = `${settings.reminderDaysBeforeHarvest} days before`;
  const backupText = `Every ${settings.backupIntervalDays} days`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Settings" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Card style={styles.sectionCard} padding={spacing.xs}>
          <SettingRow
            label="Theme"
            value={settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}
            icon="🎨"
          />
          <SettingRow
            label="Currency"
            value={settings.currency}
            icon="💵"
          />
          <SettingRow
            label="Unit System"
            value={settings.unitSystem.charAt(0).toUpperCase() + settings.unitSystem.slice(1)}
            icon="📏"
          />
        </Card>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card style={styles.sectionCard} padding={spacing.xs}>
          <SettingRow
            label="Push Notifications"
            icon="🔔"
            right={
              <Switch
                value={settings.pushNotifications}
                onValueChange={(v) => updateSettings({ pushNotifications: v })}
                trackColor={{ true: colors.light.primary, false: colors.light.disabled }}
              />
            }
          />
          <SettingRow
            label="Harvest Reminder"
            value={reminderText}
            icon="⏰"
          />
        </Card>

        <Text style={styles.sectionTitle}>Data</Text>
        <Card style={styles.sectionCard} padding={spacing.xs}>
          <SettingRow
            label="Auto Backup"
            icon="💾"
            right={
              <Switch
                value={settings.autoBackup}
                onValueChange={(v) => updateSettings({ autoBackup: v })}
                trackColor={{ true: colors.light.primary, false: colors.light.disabled }}
              />
            }
          />
          <SettingRow
            label="Backup Interval"
            value={backupText}
            icon="🔄"
          />
          <SettingRow
            label="Sync on WiFi Only"
            icon="📶"
            right={
              <Switch
                value={settings.syncOnWifiOnly}
                onValueChange={(v) => updateSettings({ syncOnWifiOnly: v })}
                trackColor={{ true: colors.light.primary, false: colors.light.disabled }}
              />
            }
          />
        </Card>

        <Text style={styles.sectionTitle}>About</Text>
        <Card style={styles.sectionCard} padding={spacing.xs}>
          <SettingRow label="App Version" value="1.0.0" icon="📱" />
          <SettingRow
            label="Offline Status"
            value={isOnline ? 'Online' : 'Offline'}
            icon="🌐"
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.light.surface },
  container: { flex: 1, backgroundColor: colors.light.background },
  content: { padding: spacing.lg },
  sectionTitle: { ...typography.label, color: colors.light.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.lg },
  sectionCard: { padding: 0, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.light.borderLight },
  settingIcon: { fontSize: 22, marginRight: spacing.md },
  settingContent: { flex: 1 },
  settingLabel: { ...typography.body, color: colors.light.textPrimary },
  settingValue: { ...typography.bodySmall, color: colors.light.textSecondary, marginTop: 2 },
});