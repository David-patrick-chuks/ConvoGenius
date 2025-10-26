import { BaseApiClient } from './base';
import { HealthStatus, Metrics, ApiResponse } from '@/types/api';

export class HealthApiClient extends BaseApiClient {
  static async getHealthStatus(): Promise<ApiResponse<HealthStatus>> {
    return this.get<HealthStatus>('/health', '');
  }

  static async getMetrics(): Promise<ApiResponse<Metrics>> {
    return this.get<Metrics>('/metrics', '');
  }
}
