import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { typography, borderRadius, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';

interface BadgeProps {
  text: string;
  color?: string;
  backgroundColor?: string;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export function Badge({ text, color, backgroundColor, size = 'medium', style }: BadgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const bgColor = backgroundColor || colors.primaryFaded;
  const textColor = color || colors.primary;

  return (
    <View style={[styles.badge, size === 'small' ? styles.small : styles.medium, { backgroundColor: bgColor }, style]}>
      <Text style={[styles.text, { color: textColor }, size === 'small' ? styles.textSmall : styles.textMedium]}>
        {text}
      </Text>
    </View>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    badge: {
      borderRadius: borderRadius.full,
      alignSelf: 'flex-start',
    },
    small: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    medium: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    text: {
      ...typography.caption,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    textSmall: {
      fontSize: 10,
    },
    textMedium: {
      fontSize: 12,
    },
  });
