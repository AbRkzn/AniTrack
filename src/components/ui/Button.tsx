import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, borderRadius, spacing } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size_],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[	ext_],
    styles[	extSize_],
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.light.primary}
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  primary: { backgroundColor: colors.light.primary },
  secondary: { backgroundColor: colors.light.primaryFaded },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.light.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.light.error },
  size_small: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  size_medium: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  size_large: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  text: { ...typography.button },
  text_primary: { color: '#FFFFFF' },
  text_secondary: { color: colors.light.primary },
  text_outline: { color: colors.light.primary },
  text_ghost: { color: colors.light.primary },
  text_danger: { color: '#FFFFFF' },
  textSize_small: { fontSize: 14 },
  textSize_medium: { fontSize: 16 },
  textSize_large: { fontSize: 18 },
  textDisabled: { opacity: 0.7 },
});
