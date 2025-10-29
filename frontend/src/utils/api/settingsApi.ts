import { ApiResponse, UserSettings } from '@/types/api';
import { BaseApiClient } from './base';

export class SettingsApiClient extends BaseApiClient {
  static async getUserSettings(token?: string): Promise<ApiResponse<UserSettings>> {
    return this.makeRequest<UserSettings>('/api/settings', { method: 'GET' }, token);
  }

  static async updateUserSettings(settings: Partial<UserSettings>, token?: string): Promise<ApiResponse<UserSettings>> {
    return this.makeRequest<UserSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(settings) }, token);
  }

  static async setup2FA() {
    return this.makeRequest<{ otpauthUrl: string; base32: string }>('/api/settings/2fa/setup', { method: 'POST' });
  }

  static async enable2FA(token: string) {
    return this.makeRequest<{ message: string }>(
      '/api/settings/2fa/enable',
      { method: 'POST', body: JSON.stringify({ token }) }
    );
  }

  static async disable2FA() {
    return this.makeRequest<{ message: string }>(
      '/api/settings/2fa/disable',
      { method: 'POST' }
    );
  }
}
