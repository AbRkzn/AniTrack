import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { typography, borderRadius, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { Icon } from './Icon';

interface DateFieldProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  minimumDate?: string;
  maximumDate?: string;
}

const toDate = (value?: string) => {
  if (value && !Number.isNaN(Date.parse(value))) return parseISO(value);
  return new Date();
};

const toValue = (date: Date) => format(date, 'yyyy-MM-dd');

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select a date',
  error,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showAndroid, setShowAndroid] = useState(false);
  const [showIos, setShowIos] = useState(false);

  const current = toDate(value);
  const min = minimumDate ? toDate(minimumDate) : undefined;
  const max = maximumDate ? toDate(maximumDate) : undefined;

  const open = () => {
    if (Platform.OS === 'android') setShowAndroid(true);
    else setShowIos(true);
  };

  const handleAndroidChange = (date?: Date) => {
    setShowAndroid(false);
    if (date) onChange(toValue(date));
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.trigger, error ? styles.triggerError : null]}
        onPress={open}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, value ? styles.triggerValue : null]} numberOfLines={1}>
          {value ? format(current, 'MMM d, yyyy') : placeholder}
        </Text>
        <Icon name="calendar-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      {showAndroid && (
        <DateTimePicker
          value={current}
          mode="date"
          display="default"
          minimumDate={min}
          maximumDate={max}
          onValueChange={(event, date) => handleAndroidChange(date)}
          onDismiss={() => setShowAndroid(false)}
        />
      )}

      <Modal visible={showIos} transparent animationType="slide" onRequestClose={() => setShowIos(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowIos(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label ?? 'Select a date'}</Text>
              <TouchableOpacity onPress={() => setShowIos(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.done}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={current}
              mode="date"
              display="spinner"
              themeVariant={isDark ? 'dark' : 'light'}
              minimumDate={min}
              maximumDate={max}
              onValueChange={(event, date) => onChange(toValue(date))}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    triggerError: {
      borderColor: colors.error,
    },
    triggerText: {
      flex: 1,
      ...typography.body,
      color: colors.textTertiary,
    },
    triggerValue: {
      color: colors.textPrimary,
    },
    error: {
      ...typography.caption,
      color: colors.error,
      marginTop: spacing.xs,
    },
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: borderRadius.full,
      backgroundColor: colors.border,
      marginBottom: spacing.md,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    sheetTitle: {
      ...typography.h4,
      color: colors.textPrimary,
    },
    done: {
      ...typography.buttonSmall,
      color: colors.primary,
    },
  });
