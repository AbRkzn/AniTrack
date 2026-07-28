import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, shadows, borderRadius, spacing } from '../../constants/theme';

interface FABProps {
  icon: string;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
  label?: string;
}

export function FAB({ icon, onPress, color = colors.light.primary, style, label }: FABProps) {
  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: color }, label ? styles.fabExtended : null, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{icon}</Text>
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  fabExtended: {
    flexDirection: 'row',
    width: 'auto',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  icon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
