import { ApiKey, ApiResponse, ChangePasswordRequest, UserSettings } from '@/types/api';
import { BaseApiClient } from './base';

export class SettingsApiClient extends BaseApiClient {
  static async getUserSettings(): Promise<ApiResponse<UserSettings>> {
    return this.get<UserSettings>('/settings?type=settings', '');
  }

  static async updateUserSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    return this.post<UserSettings>('/settings?type=settings', '', settings);
  }

  static async getApiKeys(): Promise<ApiResponse<ApiKey[]>> {
    return this.get<ApiKey[]>('/settings?type=apikeys', '');
  }

  static async addApiKey(name: string, key: string): Promise<ApiResponse<ApiKey>> {
    return this.post<ApiKey>('/settings?type=apikey', '', { name, key });
  }

  static async updateApiKey(apiKeyId: string, apiKeyData: Partial<ApiKey>): Promise<ApiResponse<ApiKey>> {
    return this.put<ApiKey>(`/settings?type=apikey&id=${apiKeyId}`, '', apiKeyData);
  }

  static async deleteApiKey(apiKeyId: string): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/settings?type=apikey&id=${apiKeyId}`, {
      method: 'DELETE',
    });
  }

  static async getApiUsage(): Promise<ApiResponse<any>> {
    return this.get<any>('/settings?type=usage', '');
  }

  static async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse<null>> {
    return this.post<null>('/settings?type=changepassword', '', passwordData);
  }
}
