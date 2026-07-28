import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, shadows } from '../../constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: { icon: string; onPress: () => void };
  rightAction?: { icon: string; onPress: () => void };
  rightComponent?: React.ReactNode;
}

export function Header({ title, subtitle, leftAction, rightAction, rightComponent }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {leftAction && (
            <TouchableOpacity onPress={leftAction.onPress} style={styles.actionButton}>
              <Text style={styles.actionIcon}>{leftAction.icon}</Text>
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
            <TouchableOpacity onPress={rightAction.onPress} style={styles.actionButton}>
              <Text style={styles.actionIcon}>{rightAction.icon}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.surface,
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
    color: colors.light.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.light.textSecondary,
    marginTop: 2,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 22,
  },
});
