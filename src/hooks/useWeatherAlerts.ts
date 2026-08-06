import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { syncWeatherAlerts } from '../services/notifications';

export function useWeatherAlerts() {
  const forecast = useAppStore((s) => s.weather.forecast);
  const pushNotifications = useAppStore((s) => s.settings.pushNotifications);

  useEffect(() => {
    syncWeatherAlerts(forecast, pushNotifications).catch(() => {});
  }, [forecast, pushNotifications]);
}
