import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, borderRadius, spacing } from '../../constants/theme';
import { Icon } from './Icon';

interface OfflineBadgeProps {
  isOnline: boolean;
}

export function OfflineBadge({ isOnline }: OfflineBadgeProps) {
  if (isOnline) return null;

  return (
    <View style={styles.badge}>
      <Icon name="cloud-offline-outline" size={14} color="#FF9800" />
      <Text style={styles.text}>Offline</Text>
    </View>
  );
}

interface StatusBadgeProps {
  status: string;
  style?: any;
}

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const getColor = () => {
    switch (status) {
      case 'growing': return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'ready_for_harvest': return { bg: '#FFF8E1', text: '#F9A825' };
      case 'harvested': return { bg: '#E8F5E9', text: '#66BB6A' };
      case 'failed': return { bg: '#FFEBEE', text: '#D32F2F' };
      case 'pending': return { bg: '#FFF3E0', text: '#FF9800' };
      case 'in_progress': return { bg: '#E3F2FD', text: '#2196F3' };
      case 'completed': return { bg: '#E8F5E9', text: '#4CAF50' };
      case 'skipped': return { bg: '#F5F5F5', text: '#9E9E9E' };
      case 'active': return { bg: '#E8F5E9', text: '#2E7D32' };
      case 'sold': return { bg: '#E3F2FD', text: '#2196F3' };
      case 'deceased': return { bg: '#FFEBEE', text: '#D32F2F' };
      case 'transferred': return { bg: '#F3E5F5', text: '#9C27B0' };
      default: return { bg: '#F5F5F5', text: '#666666' };
    }
  };

  const colors2 = getColor();
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <View style={[styles.statusBadge, { backgroundColor: colors2.bg }, style]}>
      <Text style={[styles.statusText, { color: colors2.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  text: {
    ...typography.caption,
    color: '#FF9800',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
});
