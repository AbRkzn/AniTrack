import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { colors, typography, borderRadius, spacing } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  leftIcon?: string;
  rightIcon?: string;
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
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {leftIcon && <Text style={styles.icon}>{leftIcon}</Text>}
        <TextInput
          style={[styles.input, leftIcon ? { paddingLeft: 0 } : null, style]}
          placeholderTextColor={colors.light.textTertiary}
          {...props}
        />
        {rightIcon && <Text style={styles.icon}>{rightIcon}</Text>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

interface TextAreaProps extends InputProps {
  numberOfLines?: number;
}

export function TextArea({ numberOfLines = 4, style, ...props }: TextAreaProps) {
  return (
    <Input
      multiline
      numberOfLines={numberOfLines}
      style={[styles.textArea, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.light.textPrimary,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light.surface,
    borderWidth: 1.5,
    borderColor: colors.light.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.light.error,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.light.textPrimary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  icon: {
    fontSize: 18,
    marginRight: spacing.sm,
    color: colors.light.textSecondary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: {
    ...typography.caption,
    color: colors.light.error,
    marginTop: spacing.xs,
  },
});
