import { BaseApiClient } from './base';
import { HealthStatus, Metrics, ApiResponse } from '@/types/api';

export class HealthApiClient extends BaseApiClient {
  static async getHealthStatus(): Promise<ApiResponse<HealthStatus>> {
    return this.makeRequest<HealthStatus>('/api/health', { method: 'GET' });
  }

  static async getMetrics(): Promise<ApiResponse<Metrics>> {
    return this.makeRequest<Metrics>('/api/health/metrics', { method: 'GET' });
  }
}
