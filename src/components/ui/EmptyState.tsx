import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { typography, spacing, borderRadius, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { withAlpha } from '../../utils/helpers';
import { Icon, IconName } from './Icon';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: IconName;
  color?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function EmptyState({ title, message, icon = 'grid-outline', color, action, style }: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const iconColor = color ?? colors.primary;
  const tileBg = color ? withAlpha(color, 0.12) : colors.primaryFaded;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconTile, { backgroundColor: tileBg }]}>
        <Icon name={icon} size={34} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.xxxl,
    },
    iconTile: {
      width: 76,
      height: 76,
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.h4,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    message: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    action: {
      marginTop: spacing.xl,
    },
  });
