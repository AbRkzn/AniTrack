import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { typography, borderRadius, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';

export interface ChipOption {
  label: string;
  value: string;
}

interface ChipSelectProps {
  label?: string;
  options: ChipOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function ChipSelect({ label, options, value, onChange, error }: ChipSelectProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onChange(option.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.lg,
    },
    label: {
      ...typography.label,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryFaded,
    },
    chipText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    chipTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    error: {
      ...typography.caption,
      color: colors.error,
      marginTop: spacing.xs,
    },
  });
