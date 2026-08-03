import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { typography, borderRadius, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { Icon } from './Icon';
import { pickPhotos, capturePhoto, deletePhotoFile } from '../../services/photoLibrary';

interface PhotoPickerProps {
  label?: string;
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
}

export function PhotoPicker({ label = 'Photos', photos, onChange, max = 6 }: PhotoPickerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const atMax = photos.length >= max;

  const onPick = useCallback(async () => {
    try {
      const next = await pickPhotos(photos, max);
      if (next.length !== photos.length) onChange(next);
    } catch (error) {
      Alert.alert('Photos', error instanceof Error ? error.message : 'Could not open the photo library.');
    }
  }, [photos, max, onChange]);

  const onCapture = useCallback(async () => {
    try {
      const next = await capturePhoto(photos, max);
      if (next.length !== photos.length) onChange(next);
    } catch (error) {
      Alert.alert('Camera', error instanceof Error ? error.message : 'Could not open the camera.');
    }
  }, [photos, max, onChange]);

  const onRemove = useCallback(
    (uri: string) => {
      onChange(photos.filter((u) => u !== uri));
      deletePhotoFile(uri);
    },
    [photos, onChange]
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      {photos.length > 0 && (
        <View style={styles.gallery}>
          {photos.map((uri) => (
            <View key={uri} style={styles.thumbnailWrap}>
              <Image source={{ uri }} style={styles.thumbnail} />
              <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(uri)} hitSlop={6}>
                <Icon name="close" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionChip, atMax && styles.actionChipDisabled]}
          onPress={onPick}
          disabled={atMax}
          activeOpacity={0.7}
        >
          <Icon name="images-outline" size={16} color={atMax ? colors.disabled : colors.primary} />
          <Text style={[styles.actionText, atMax && { color: colors.disabled }]}>
            {atMax ? 'Max photos' : 'Add Photos'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionChip, atMax && styles.actionChipDisabled]}
          onPress={onCapture}
          disabled={atMax}
          activeOpacity={0.7}
        >
          <Icon name="camera-outline" size={16} color={atMax ? colors.disabled : colors.primary} />
          <Text style={[styles.actionText, atMax && { color: colors.disabled }]}>Take Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    container: { marginBottom: spacing.lg },
    label: {
      ...typography.label,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    gallery: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    thumbnailWrap: { position: 'relative' },
    thumbnail: {
      width: 72,
      height: 72,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceVariant,
    },
    removeButton: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    actions: { flexDirection: 'row', gap: spacing.sm },
    actionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: colors.primaryFaded,
    },
    actionChipDisabled: {
      borderColor: colors.disabledBackground,
      backgroundColor: colors.surfaceVariant,
    },
    actionText: {
      ...typography.bodySmall,
      color: colors.primary,
      fontWeight: '600',
    },
  });
