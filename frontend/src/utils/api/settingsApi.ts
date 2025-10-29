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

  static async get2FAQr() {
    return this.makeRequest<{ dataUrl: string }>(
      '/api/settings/2fa/qr',
      { method: 'GET' }
    );
  }

  // Optional API key helpers (backend may implement later)
  static async getApiKeys() {
    return this.makeRequest<any[]>('/api/settings/apikeys', { method: 'GET' });
  }

  static async getApiUsage() {
    return this.makeRequest<any>('/api/settings/usage', { method: 'GET' });
  }

  static async addApiKey(name: string, key: string) {
    return this.makeRequest<any>('/api/settings/apikeys', { method: 'POST', body: JSON.stringify({ name, key }) });
  }

  static async deleteApiKey(id: string) {
    return this.makeRequest<any>(`/api/settings/apikeys/${id}`, { method: 'DELETE' });
  }
}
