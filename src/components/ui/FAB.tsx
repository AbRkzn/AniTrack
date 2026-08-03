import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { shadows, borderRadius, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { Icon, IconName } from './Icon';

interface FABProps {
  icon: IconName;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
  label?: string;
}

export function FAB({ icon, onPress, color, style, label }: FABProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const backgroundColor = color || colors.primary;

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor }, label ? styles.fabExtended : null, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Icon name={icon} size={24} color="#FFFFFF" />
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
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
    label: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 16,
    },
  });
