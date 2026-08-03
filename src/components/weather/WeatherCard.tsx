import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { typography, spacing, ColorScheme } from '../../constants/theme';
import { useTheme } from '../../constants/themeContext';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { useAppStore } from '../../store/appStore';
import { formatNumber, getWeatherMeta, withAlpha } from '../../utils/helpers';

export function WeatherCard({ onPress }: { onPress?: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const weather = useAppStore((s) => s.weather);
  const settings = useAppStore((s) => s.settings);
  const fetchWeather = useAppStore((s) => s.fetchWeather);

  const tempUnit = settings.unitSystem === 'imperial' ? '°F' : '°C';
  const windUnit = settings.unitSystem === 'imperial' ? 'mph' : 'km/h';
  const precipUnit = settings.unitSystem === 'imperial' ? 'in' : 'mm';

  const current = weather.current;

  if (weather.isLoading && !current) {
    return (
      <Card style={styles.card} padding={spacing.lg}>
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Syncing weather…</Text>
        </View>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card style={styles.card} padding={spacing.lg}>
        <View style={styles.headerRow}>
          <View style={[styles.iconTile, { backgroundColor: colors.primaryFaded }]}>
            <Icon name="partly-sunny-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Weather</Text>
            <Text style={styles.subtitle}>No weather data yet</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primaryFaded }]} onPress={() => fetchWeather().catch(() => {})}>
          <Text style={[styles.retryText, { color: colors.primary }]}>Sync now</Text>
        </TouchableOpacity>
      </Card>
    );
  }

  const meta = getWeatherMeta(current.conditions);
  const location =
    settings.farmLocationName ||
    (settings.farmLatitude && settings.farmLongitude
      ? `${settings.farmLatitude.toFixed(2)}, ${settings.farmLongitude.toFixed(2)}`
      : current.location) ||
    'Farm location';

  return (
    <Card style={styles.card} padding={spacing.lg} onPress={onPress}>
      <View style={styles.headerRow}>
        <View style={[styles.iconTile, { backgroundColor: withAlpha(meta.color, 0.12) }]}>
          <Icon name={meta.icon} size={24} color={meta.color} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Weather</Text>
          <Text style={[styles.subtitle, { color: meta.color }]}>{meta.label}</Text>
          <View style={styles.locationRow}>
            <Icon name="location-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        </View>
        <View style={styles.tempBlock}>
          <Text style={styles.tempHigh}>
            {Math.round(current.temperatureHigh)}°
          </Text>
          <Text style={styles.tempLow}>
            {Math.round(current.temperatureLow)}° <Text style={styles.tempUnit}>{tempUnit}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Icon name="water-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.metricText}>{Math.round(current.humidity)}%</Text>
        </View>
        <View style={styles.metric}>
          <Icon name="speedometer-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.metricText}>{formatNumber(current.windSpeed)} {windUnit}</Text>
        </View>
        <View style={styles.metric}>
          <Icon name="umbrella-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.metricText}>{formatNumber(current.precipitation)} {precipUnit}</Text>
        </View>
      </View>
    </Card>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    card: {
      marginBottom: spacing.xl,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconTile: {
      width: 46,
      height: 46,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleBlock: {
      flex: 1,
    },
    title: {
      ...typography.bodySmall,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginTop: 3,
    },
    locationText: {
      ...typography.caption,
      color: colors.textTertiary,
      flexShrink: 1,
    },
    tempBlock: {
      alignItems: 'flex-end',
    },
    tempHigh: {
      ...typography.h2,
      color: colors.textPrimary,
      lineHeight: 32,
    },
    tempLow: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    tempUnit: {
      fontSize: 11,
    },
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    metric: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    metricText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    loadingText: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    retryButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 999,
      marginTop: spacing.md,
    },
    retryText: {
      ...typography.buttonSmall,
    },
  });
