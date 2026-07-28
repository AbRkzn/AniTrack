import { AppSettings, DEFAULT_SETTINGS } from '../../../types';
import { queryFirst, executeSql } from '../../../database';

export class SettingsRepository {
  private static SETTINGS_KEY = 'app_settings';

  async getSettings(): Promise<AppSettings> {
    const row = await queryFirst<any>(
      'SELECT value FROM settings WHERE key = ?',
      [SettingsRepository.SETTINGS_KEY]
    );
    if (row) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) };
    }
    await this.saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await executeSql(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [SettingsRepository.SETTINGS_KEY, JSON.stringify(settings)]
    );
  }

  async updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, [key]: value };
    await this.saveSettings(updated);
    return updated;
  }

  async resetSettings(): Promise<AppSettings> {
    await this.saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }

  async getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    const settings = await this.getSettings();
    return settings[key];
  }
}
