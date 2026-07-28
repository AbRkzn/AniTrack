import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../constants/theme';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.light.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  return (
    <View style={[styles.skeleton, { width, height, borderRadius }, style]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  message: {
    ...typography.body,
    color: colors.light.textSecondary,
    marginTop: spacing.md,
  },
  skeleton: {
    backgroundColor: '#E0E0E0',
    opacity: 0.7,
  },
});
