import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, typography, borderRadius, spacing, shadows } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  padding?: number;
  margin?: number;
}

export function Card({ children, style, onPress, padding = spacing.lg, margin }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, { padding, margin }, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, { padding, margin }, style]}>
      {children}
    </View>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  color?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function StatCard({ title, value, icon, color, subtitle, onPress, style }: StatCardProps) {
  return (
    <Card onPress={onPress} style={[styles.statCard, style]} padding={spacing.md}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        {icon && <Text style={styles.statIcon}>{icon}</Text>}
      </View>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </Card>
  );
}

interface InfoCardProps {
  label: string;
  value: string | number;
  icon?: string;
  style?: ViewStyle;
}

export function InfoCard({ label, value, icon, style }: InfoCardProps) {
  return (
    <View style={[styles.infoCard, style]}>
      {icon && <Text style={styles.infoIcon}>{icon}</Text>}
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statTitle: {
    ...typography.caption,
    color: colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statIcon: {
    fontSize: 18,
  },
  statValue: {
    ...typography.h3,
    color: colors.light.textPrimary,
  },
  statSubtitle: {
    ...typography.caption,
    color: colors.light.textSecondary,
    marginTop: spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surfaceVariant,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.light.textSecondary,
    flex: 1,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },
});
