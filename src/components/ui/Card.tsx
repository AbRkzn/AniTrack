import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { typography, borderRadius, spacing, shadows, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { withAlpha } from '../../utils/helpers';
import { Icon, IconName } from './Icon';

interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  onLongPress?: () => void;
  padding?: number;
  margin?: number;
}

export function Card({ children, style, onPress, onLongPress, padding = spacing.lg, margin }: CardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, { padding, margin }, style]}
        onPress={onPress}
        onLongPress={onLongPress}
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
  icon?: IconName;
  color?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function StatCard({ title, value, icon, color, subtitle, onPress, style }: StatCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const iconColor = color ?? colors.primary;
  const tileBg = color ? withAlpha(color, 0.12) : colors.primaryFaded;

  return (
    <Card onPress={onPress} style={[styles.statCard, style]} padding={spacing.md}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        {icon && (
          <View style={[styles.statIconTile, { backgroundColor: tileBg }]}>
            <Icon name={icon} size={16} color={iconColor} />
          </View>
        )}
      </View>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </Card>
  );
}

interface InfoCardProps {
  label: string;
  value: string | number;
  icon?: IconName;
  style?: ViewStyle;
}

export function InfoCard({ label, value, icon, style }: InfoCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.infoCard, style]}>
      {icon && (
        <View style={styles.infoIconTile}>
          <Icon name={icon} size={18} color={colors.primary} />
        </View>
      )}
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
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
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statIconTile: {
      width: 30,
      height: 30,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statValue: {
      ...typography.h3,
      color: colors.textPrimary,
    },
    statSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    infoIconTile: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoLabel: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      flex: 1,
    },
    infoValue: {
      ...typography.body,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  });
