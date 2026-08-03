import { WeatherRepository } from '../features/weather/repository/weatherRepository';
import type { AppSettings, WeatherRecord } from '../types';

const weatherRepository = new WeatherRepository();

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  relative_humidity_2m_mean: number[];
  wind_speed_10m_max: number[];
  weather_code: number[];
}

interface OpenMeteoResponse {
  daily: OpenMeteoDaily;
}

function wmoToCondition(code: number): string {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly_cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'cloudy';
}

function buildUrl(settings: AppSettings): string {
  const params = new URLSearchParams({
    latitude: String(settings.farmLatitude),
    longitude: String(settings.farmLongitude),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean,wind_speed_10m_max,weather_code',
    timezone: 'auto',
    forecast_days: '7',
  });

  if (settings.unitSystem === 'imperial') {
    params.set('temperature_unit', 'fahrenheit');
    params.set('wind_speed_unit', 'mph');
    params.set('precipitation_unit', 'inch');
  }

  return `${OPEN_METEO_URL}?${params.toString()}`;
}

export async function fetchWeatherFromApi(settings: AppSettings): Promise<OpenMeteoResponse> {
  const response = await fetch(buildUrl(settings), { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`);
  }
  return (await response.json()) as OpenMeteoResponse;
}

export async function syncWeatherFromApi(settings: AppSettings): Promise<{
  current: WeatherRecord | null;
  forecast: WeatherRecord[];
  lastSync: string | null;
}> {
  const data = await fetchWeatherFromApi(settings);
  const location = `${settings.farmLatitude.toFixed(2)}, ${settings.farmLongitude.toFixed(2)}`;

  for (let i = 0; i < data.daily.time.length; i++) {
    await weatherRepository.upsert({
      date: data.daily.time[i],
      temperatureHigh: data.daily.temperature_2m_max[i],
      temperatureLow: data.daily.temperature_2m_min[i],
      precipitation: data.daily.precipitation_sum[i],
      humidity: data.daily.relative_humidity_2m_mean[i],
      windSpeed: data.daily.wind_speed_10m_max[i],
      conditions: wmoToCondition(data.daily.weather_code[i]),
      notes: '',
      location,
      dataSource: 'open-meteo',
    });
  }

  await weatherRepository.clearOldCache(30);
  return weatherRepository.getWeatherData();
}
