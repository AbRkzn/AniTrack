import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, spacing, shadows, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { Icon, IconName } from './Icon';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: { icon: IconName; onPress: () => void };
  rightAction?: { icon: IconName; onPress: () => void };
  rightComponent?: React.ReactNode;
}

export function Header({ title, subtitle, leftAction, rightAction, rightComponent }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {leftAction && (
            <TouchableOpacity onPress={leftAction.onPress} style={styles.actionButton} hitSlop={8}>
              <Icon name={leftAction.icon} size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        <View style={styles.right}>
          {rightComponent}
          {rightAction && (
            <TouchableOpacity onPress={rightAction.onPress} style={styles.actionButton} hitSlop={8}>
              <Icon name={rightAction.icon} size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      ...shadows.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      ...typography.h3,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
