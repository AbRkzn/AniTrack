import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, typography } from '../../constants/theme';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  label?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ progress, color = colors.light.primary, height = 8, label, showPercentage = false }: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={styles.container}>
      {(label || showPercentage) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercentage && <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: ${clampedProgress}%, backgroundColor: color, height }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.light.textSecondary,
  },
  percentage: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },
  track: {
    backgroundColor: colors.light.borderLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: borderRadius.full,
  },
});
