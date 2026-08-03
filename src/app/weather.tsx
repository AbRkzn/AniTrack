import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { useAppStore } from '../store/appStore';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { typography, spacing, borderRadius, ColorScheme } from '../constants/theme';
import { useTheme } from '../constants/themeContext';
import { formatDate, formatNumber, getWeatherMeta, withAlpha } from '../utils/helpers';

export default function WeatherScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const weather = useAppStore((s) => s.weather);
  const settings = useAppStore((s) => s.settings);
  const fetchWeather = useAppStore((s) => s.fetchWeather);

  const tempUnit = settings.unitSystem === 'imperial' ? '°F' : '°C';
  const windUnit = settings.unitSystem === 'imperial' ? 'mph' : 'km/h';
  const precipUnit = settings.unitSystem === 'imperial' ? 'in' : 'mm';

  const { current, forecast, lastSync, isLoading, error } = weather;

  const refresh = () => fetchWeather().catch(() => {});

  if (isLoading && !current) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header
          title="Weather"
          leftAction={{ icon: 'arrow-back', onPress: () => router.back() }}
          rightAction={{ icon: 'refresh-outline', onPress: refresh }}
        />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!current) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header
          title="Weather"
          leftAction={{ icon: 'arrow-back', onPress: () => router.back() }}
          rightAction={{ icon: 'refresh-outline', onPress: refresh }}
        />
        <EmptyState
          icon="partly-sunny-outline"
          title="No weather data"
          message="Connect to the internet and sync to fetch your farm's weather."
          action={<Button title="Sync now" onPress={refresh} />}
        />
      </SafeAreaView>
    );
  }

  const meta = getWeatherMeta(current.conditions);
  const location = settings.farmLatitude && settings.farmLongitude
    ? `${settings.farmLatitude.toFixed(2)}, ${settings.farmLongitude.toFixed(2)}`
    : current.location || 'Farm location';

  const dayLabel = (date: string, index: number) => {
    if (index === 0) return 'Today';
    try {
      return format(parseISO(date), 'EEE');
    } catch {
      return date;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Weather"
        subtitle={location}
        leftAction={{ icon: 'arrow-back', onPress: () => router.back() }}
        rightAction={{ icon: 'refresh-outline', onPress: refresh }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {error && (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Card style={styles.heroCard} padding={spacing.xl}>
          <View style={[styles.heroIconTile, { backgroundColor: withAlpha(meta.color, 0.12) }]}>
            <Icon name={meta.icon} size={44} color={meta.color} />
          </View>
          <Text style={[styles.heroCondition, { color: meta.color }]}>{meta.label}</Text>
          <Text style={styles.heroDate}>{formatDate(current.date, 'EEEE, MMMM d, yyyy')}</Text>
          <View style={styles.heroTemps}>
            <View style={styles.heroTempBlock}>
              <Text style={styles.heroTemp}>{Math.round(current.temperatureHigh)}°</Text>
              <Text style={styles.heroTempLabel}>High</Text>
            </View>
            <View style={styles.heroTempDivider} />
            <View style={styles.heroTempBlock}>
              <Text style={[styles.heroTemp, { color: colors.textSecondary }]}>{Math.round(current.temperatureLow)}°</Text>
              <Text style={styles.heroTempLabel}>Low</Text>
            </View>
          </View>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Icon name="water-outline" size={18} color={colors.primary} />
              <Text style={styles.metricValue}>{Math.round(current.humidity)}%</Text>
              <Text style={styles.metricLabel}>Humidity</Text>
            </View>
            <View style={styles.metricItem}>
              <Icon name="speedometer-outline" size={18} color={colors.primary} />
              <Text style={styles.metricValue}>{formatNumber(current.windSpeed)} {windUnit}</Text>
              <Text style={styles.metricLabel}>Wind</Text>
            </View>
            <View style={styles.metricItem}>
              <Icon name="umbrella-outline" size={18} color={colors.primary} />
              <Text style={styles.metricValue}>{formatNumber(current.precipitation)} {precipUnit}</Text>
              <Text style={styles.metricLabel}>Precipitation</Text>
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7-Day Forecast</Text>
          {forecast.length === 0 ? (
            <Card padding={spacing.lg}>
              <Text style={styles.forecastEmpty}>No forecast data available.</Text>
            </Card>
          ) : (
            <Card padding={spacing.xs} style={styles.forecastCard}>
              {forecast.map((day, index) => {
                const dayMeta = getWeatherMeta(day.conditions);
                return (
                  <View key={day.id} style={styles.forecastRow}>
                    <Text style={styles.forecastDay}>{dayLabel(day.date, index)}</Text>
                    <Icon name={dayMeta.icon} size={18} color={dayMeta.color} />
                    <Text style={[styles.forecastCondition, { color: dayMeta.color }]} numberOfLines={1}>
                      {dayMeta.label}
                    </Text>
                    <View style={styles.forecastRain}>
                      <Icon name="umbrella-outline" size={14} color={colors.textTertiary} />
                      <Text style={styles.forecastRainText}>{formatNumber(day.precipitation)} {precipUnit}</Text>
                    </View>
                    <Text style={styles.forecastTemps}>
                      <Text style={styles.forecastHigh}>{Math.round(day.temperatureHigh)}°</Text>{' '}
                      <Text style={styles.forecastLow}>{Math.round(day.temperatureLow)}°</Text>
                    </Text>
                  </View>
                );
              })}
            </Card>
          )}
        </View>

        {lastSync && (
          <Text style={styles.lastSync}>Last synced {formatDate(lastSync, 'MMM d, h:mm a')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.surface },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.errorLight,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
      flex: 1,
    },
    heroCard: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    heroIconTile: {
      width: 88,
      height: 88,
      borderRadius: borderRadius.full,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    heroCondition: {
      ...typography.h3,
      marginBottom: spacing.xs,
    },
    heroDate: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    heroTemps: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xl,
      marginBottom: spacing.lg,
    },
    heroTempBlock: {
      alignItems: 'center',
    },
    heroTemp: {
      ...typography.h1,
      color: colors.textPrimary,
      lineHeight: 40,
    },
    heroTempLabel: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    heroTempDivider: {
      width: 1,
      height: 36,
      backgroundColor: colors.borderLight,
    },
    metricsGrid: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-around',
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    metricItem: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    metricValue: {
      ...typography.bodySmall,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    metricLabel: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    section: { marginBottom: spacing.xl },
    sectionTitle: {
      ...typography.h4,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    forecastCard: { overflow: 'hidden' },
    forecastRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    forecastDay: {
      ...typography.bodySmall,
      fontWeight: '600',
      color: colors.textPrimary,
      width: 56,
    },
    forecastCondition: {
      ...typography.bodySmall,
      flex: 1,
    },
    forecastRain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      minWidth: 78,
    },
    forecastRainText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    forecastTemps: {
      minWidth: 56,
      textAlign: 'right',
    },
    forecastHigh: {
      ...typography.bodySmall,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    forecastLow: {
      ...typography.bodySmall,
      color: colors.textSecondary,
    },
    forecastEmpty: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    lastSync: {
      ...typography.caption,
      color: colors.textTertiary,
      textAlign: 'center',
    },
  });
