import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { typography, borderRadius, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const variantStyle = variant === 'primary' ? styles.primary
    : variant === 'secondary' ? styles.secondary
    : variant === 'outline' ? styles.outline
    : variant === 'ghost' ? styles.ghost
    : styles.danger;

  const sizeStyle = size === 'small' ? styles.size_small
    : size === 'large' ? styles.size_large
    : styles.size_medium;

  const textSize = size === 'small' ? styles.textSize_small
    : size === 'large' ? styles.textSize_large
    : styles.textSize_medium;

  const textColor = variant === 'primary' || variant === 'danger'
    ? styles.text_primary
    : variant === 'secondary' ? styles.text_secondary
    : variant === 'outline' ? styles.text_outline
    : styles.text_ghost;

  return (
    <TouchableOpacity
      style={[styles.base, variantStyle, sizeStyle, fullWidth && styles.fullWidth, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.primary}
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, textColor, textSize, disabled && styles.textDisabled, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.lg,
      gap: spacing.sm,
    },
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.primaryFaded },
    outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.error },
    size_small: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    size_medium: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    size_large: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
    fullWidth: { width: '100%' },
    disabled: { opacity: 0.5 },
    text: { ...typography.button },
    text_primary: { color: '#FFFFFF' },
    text_secondary: { color: colors.primary },
    text_outline: { color: colors.primary },
    text_ghost: { color: colors.primary },
    text_danger: { color: '#FFFFFF' },
    textSize_small: { fontSize: 14 },
    textSize_medium: { fontSize: 16 },
    textSize_large: { fontSize: 18 },
    textDisabled: { opacity: 0.7 },
  });
