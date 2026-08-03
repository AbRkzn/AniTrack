import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { typography, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Loading...' }: LoadingOverlayProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 16, style }: SkeletonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <View style={[styles.skeleton, { width, height }, style]} />;
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.xl,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.md,
    },
    message: {
      ...typography.body,
      color: colors.textSecondary,
    },
    skeleton: {
      backgroundColor: colors.borderLight,
      borderRadius: 8,
    },
  });
