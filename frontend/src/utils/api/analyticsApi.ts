import { Analytics, ApiResponse } from '@/types/api';
import { BaseApiClient } from './base';

export class AnalyticsApiClient extends BaseApiClient {
  static async getAnalytics(agentId?: string, platform?: string, period?: string): Promise<ApiResponse<Analytics>> {
    const params = new URLSearchParams();
    if (agentId) params.append('agentId', agentId);
    if (platform) params.append('platform', platform);
    if (period) params.append('period', period);
    
    const queryString = params.toString();
    return this.get<Analytics>(`/analytics${queryString ? `?${queryString}` : ''}`, '');
  }
}
