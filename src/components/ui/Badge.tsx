import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, borderRadius, spacing } from '../../constants/theme';

interface BadgeProps {
  text: string;
  color?: string;
  backgroundColor?: string;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export function Badge({ text, color, backgroundColor, size = 'medium', style }: BadgeProps) {
  const bgColor = backgroundColor || colors.light.primaryFaded;
  const textColor = color || colors.light.primary;

  return (
    <View style={[styles.badge, size === 'small' ? styles.small : styles.medium, { backgroundColor: bgColor }, style]}>
      <Text style={[styles.text, { color: textColor }, size === 'small' ? styles.textSmall : styles.textMedium]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
