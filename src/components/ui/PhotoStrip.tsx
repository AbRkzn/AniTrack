import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { borderRadius, spacing } from '../../constants/theme';

interface PhotoStripProps {
  photos: string[];
  size?: number;
}

export function PhotoStrip({ photos, size = 44 }: PhotoStripProps) {
  if (!photos || photos.length === 0) return null;

  return (
    <View style={styles.row}>
      {photos.slice(0, 4).map((uri) => (
        <Image key={uri} source={{ uri }} style={{ width: size, height: size, borderRadius: borderRadius.md }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
