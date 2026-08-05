import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  Keyboard,
  Platform,
} from 'react-native';
import { typography, borderRadius, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { Icon } from './Icon';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  options?: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  allowCustom?: boolean;
  searchable?: boolean;
}

type RowItem = { kind: 'option'; option: SelectOption } | { kind: 'custom'; label: string };

export function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  allowCustom = false,
  searchable = true,
}: SelectProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const selected = options.find((o) => o.value === value);
  const display = selected ? selected.label : value && value.trim() !== '' ? value : '';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const exactMatch = filtered.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());
  const showCustom = allowCustom && query.trim() !== '' && !exactMatch;

  const rows: RowItem[] = useMemo(() => {
    const customRows: RowItem[] = showCustom ? [{ kind: 'custom', label: query.trim() }] : [];
    return [...customRows, ...filtered.map((option) => ({ kind: 'option' as const, option }))];
  }, [showCustom, query, filtered]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const pick = (nextValue: string) => {
    onChange(nextValue);
    close();
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.trigger, error ? styles.triggerError : null]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, display ? styles.triggerValue : null]} numberOfLines={1}>
          {display || placeholder}
        </Text>
        <Icon name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <Pressable style={[styles.backdrop, keyboardHeight > 0 && { paddingBottom: keyboardHeight }]} onPress={close}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            {label && <Text style={styles.sheetTitle}>{label}</Text>}

              {searchable || allowCustom ? (
                <View style={styles.searchWrapper}>
                  <Icon name="search" size={16} color={colors.textSecondary} />
                  <TextInput
                    style={styles.searchInput}
                    value={query}
                    onChangeText={setQuery}
                    placeholder={allowCustom ? 'Search or type your own' : 'Search'}
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />
                  {query !== '' && (
                    <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Icon name="close-circle" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}

              <FlatList
                data={rows}
                keyExtractor={(item) => (item.kind === 'custom' ? '__custom__' : item.option.value)}
                renderItem={({ item }) => {
                  if (item.kind === 'custom') {
                    return (
                      <TouchableOpacity style={styles.row} onPress={() => pick(item.label)}>
                        <Icon name="create-outline" size={18} color={colors.primary} />
                        <Text style={[styles.rowLabel, styles.rowLabelCustom]}>Use “{item.label}”</Text>
                      </TouchableOpacity>
                    );
                  }
                  const isSelected = item.option.value === value;
                  return (
                    <TouchableOpacity
                      style={[styles.row, isSelected && styles.rowSelected]}
                      onPress={() => pick(item.option.value)}
                    >
                      <Text style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}>{item.option.label}</Text>
                      {isSelected && <Icon name="checkmark" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={<Text style={styles.empty}>No matches</Text>}
                keyboardShouldPersistTaps="handled"
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
      maxHeight: '70%',
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: borderRadius.full,
      backgroundColor: colors.border,
      marginBottom: spacing.md,
    },
    sheetTitle: {
      ...typography.h4,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceVariant,
      borderRadius: borderRadius.lg,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    searchInput: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      paddingVertical: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderLight,
    },
    rowSelected: {
      backgroundColor: colors.primaryFaded,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
    },
    rowLabel: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
    },
    rowLabelSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    rowLabelCustom: {
      color: colors.primary,
    },
    empty: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.xl,
    },
  });
