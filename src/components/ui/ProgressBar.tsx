import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { typography, borderRadius, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  label?: string;
  showPercentage?: boolean;
  labelColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({ progress, color, height = 8, label, showPercentage = false, labelColor, style }: ProgressBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const clamped = Math.max(0, Math.min(1, progress));
  const barColor = color || colors.primary;
  const textColor = labelColor || colors.textSecondary;

  return (
    <View style={style}>
      {(label || showPercentage) && (
        <View style={styles.labelRow}>
          {label && <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
          {showPercentage && <Text style={[styles.percentage, { color: textColor }]}>{Math.round(clamped * 100)}%</Text>}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${clamped * 100}%`, height, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    label: {
      ...typography.caption,
    },
    percentage: {
      ...typography.caption,
      fontWeight: '600',
    },
    track: {
      backgroundColor: colors.borderLight,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
    },
    fill: {
      borderRadius: borderRadius.full,
    },
  });
