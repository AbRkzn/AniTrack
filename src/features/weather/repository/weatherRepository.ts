import { WeatherRecord } from '../../../types';
import { queryAll, queryFirst, executeSql } from '../../../database';

export class WeatherRepository {
  async getAll(): Promise<WeatherRecord[]> {
    const rows = await queryAll<any>('SELECT * FROM weather_cache ORDER BY date DESC');
    return rows.map(this.mapRowToWeather);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<WeatherRecord[]> {
    const rows = await queryAll<any>(
      'SELECT * FROM weather_cache WHERE date >= ? AND date <= ? ORDER BY date ASC',
      [startDate, endDate]
    );
    return rows.map(this.mapRowToWeather);
  }

  async getLatest(): Promise<WeatherRecord | null> {
    const row = await queryFirst<any>('SELECT * FROM weather_cache ORDER BY date DESC LIMIT 1');
    return row ? this.mapRowToWeather(row) : null;
  }

  async getWeatherData(): Promise<{ current: WeatherRecord | null; forecast: WeatherRecord[]; lastSync: string | null }> {
    const current = await this.getLatest();
    const today = new Date().toISOString().split('T')[0];
    const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const forecast = await this.getByDateRange(today, weekLater);
    const lastSyncRow = await queryFirst<any>('SELECT MAX(createdAt) as lastSync FROM weather_cache');
    return { current, forecast, lastSync: lastSyncRow?.lastSync || null };
  }

  async upsert(data: Omit<WeatherRecord, 'id' | 'createdAt'>): Promise<WeatherRecord> {
    const existing = await queryFirst<any>('SELECT id FROM weather_cache WHERE date = ? AND location = ?', [data.date, data.location || '']);
    const now = new Date().toISOString();

    if (existing) {
      await executeSql(
        'UPDATE weather_cache SET temperatureHigh = ?, temperatureLow = ?, precipitation = ?, humidity = ?, windSpeed = ?, conditions = ?, notes = ? WHERE id = ?',
        [data.temperatureHigh, data.temperatureLow, data.precipitation, data.humidity, data.windSpeed, data.conditions, data.notes, existing.id]
      );
      const row = await queryFirst<any>('SELECT * FROM weather_cache WHERE id = ?', [existing.id]);
      return this.mapRowToWeather(row!);
    }

    const id = weather__;
    await executeSql(
      'INSERT INTO weather_cache (id, date, temperatureHigh, temperatureLow, precipitation, humidity, windSpeed, conditions, location, dataSource, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.date, data.temperatureHigh, data.temperatureLow, data.precipitation, data.humidity, data.windSpeed, data.conditions, data.location || '', data.dataSource || 'manual', now]
    );

    const row = await queryFirst<any>('SELECT * FROM weather_cache WHERE id = ?', [id]);
    return this.mapRowToWeather(row!);
  }

  async clearOldCache(daysToKeep: number = 30): Promise<void> {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
    await executeSql('DELETE FROM weather_cache WHERE date < ?', [cutoff]);
  }

  private mapRowToWeather(row: any): WeatherRecord {
    return {
      id: row.id,
      date: row.date,
      temperatureHigh: row.temperatureHigh,
      temperatureLow: row.temperatureLow,
      precipitation: row.precipitation,
      humidity: row.humidity,
      windSpeed: row.windSpeed,
      conditions: row.conditions,
      notes: row.notes || '',
      location: row.location || '',
      dataSource: row.dataSource || 'cache',
      createdAt: row.createdAt,
    };
  }
}
