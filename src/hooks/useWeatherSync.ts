import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { useOnlineStatus } from './useOnlineStatus';

const SYNC_THROTTLE_MS = 15 * 60 * 1000;

export function useWeatherSync(enabled = true) {
  useOnlineStatus();
  const isOnline = useAppStore((s) => s.isOnline);
  const fetchWeather = useAppStore((s) => s.fetchWeather);
  const lastSync = useAppStore((s) => s.weather.lastSync);
  const prevOnline = useRef<boolean | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const wasOnline = prevOnline.current;
    prevOnline.current = isOnline;

    const recentSync =
      !!lastSync && Date.now() - new Date(lastSync).getTime() < SYNC_THROTTLE_MS;

    if (!isOnline) return;
    if (wasOnline === null && recentSync) return;
    if (wasOnline === true) return;

    fetchWeather().catch(() => {});
  }, [enabled, isOnline, lastSync, fetchWeather]);
}
