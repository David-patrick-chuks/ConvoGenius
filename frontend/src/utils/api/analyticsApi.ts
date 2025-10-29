import { Analytics, ApiResponse } from '@/types/api';
import { BaseApiClient } from './base';

export class AnalyticsApiClient extends BaseApiClient {
  static async getDashboard(period?: '7d' | '30d' | '90d' | '1y', token?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    const qs = params.toString();
    return this.makeRequest<any>(`/api/analytics/dashboard${qs ? `?${qs}` : ''}`, { method: 'GET' }, token);
  }

  static async getAgent(agentId: string, period?: '7d' | '30d' | '90d' | '1y', token?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    const qs = params.toString();
    return this.makeRequest<any>(`/api/analytics/agents/${agentId}${qs ? `?${qs}` : ''}`, { method: 'GET' }, token);
  }

  static async getConversations(period?: '7d' | '30d' | '90d' | '1y', token?: string): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    const qs = params.toString();
    return this.makeRequest<any>(`/api/analytics/conversations${qs ? `?${qs}` : ''}`, { method: 'GET' }, token);
  }

  static async getTraining(token?: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/analytics/training', { method: 'GET' }, token);
  }
}
