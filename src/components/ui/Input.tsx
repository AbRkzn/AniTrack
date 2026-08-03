import React, { useMemo } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { typography, borderRadius, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { Icon, IconName } from './Icon';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: IconName;
  rightIcon?: IconName;
}

export function Input({
  label,
  error,
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {leftIcon && <Icon name={leftIcon} size={18} color={colors.textSecondary} style={styles.icon} />}
        <TextInput
          style={[styles.input, leftIcon ? { paddingLeft: 0 } : null, style]}
          placeholderTextColor={colors.textTertiary}
          {...props}
        />
        {rightIcon && <Icon name={rightIcon} size={18} color={colors.textSecondary} style={styles.icon} />}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

interface TextAreaProps extends InputProps {
  numberOfLines?: number;
}

export function TextArea({ numberOfLines = 4, style, ...props }: TextAreaProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Input
      multiline
      numberOfLines={numberOfLines}
      style={[styles.textArea, style]}
      {...props}
    />
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
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
    },
    inputError: {
      borderColor: colors.error,
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
    },
    icon: {
      fontSize: 18,
      marginRight: spacing.sm,
      color: colors.textSecondary,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    error: {
      ...typography.caption,
      color: colors.error,
      marginTop: spacing.xs,
    },
  });
