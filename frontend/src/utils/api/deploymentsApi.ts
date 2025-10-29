import { ApiResponse, Deployment, DeploymentConfig } from '@/types/api';
import { BaseApiClient } from './base';

export interface DeploymentsSummary {
  connectedCount: number;
  platformCounts: Record<string, number>;
  totalDeployments: number;
}

export class DeploymentsApiClient extends BaseApiClient {
  static async getDeployments(token?: string): Promise<ApiResponse<Deployment[]>> {
    return this.makeRequest<Deployment[]>('/api/deployments', { method: 'GET' }, token);
  }

  static async getDeploymentsSummary(token?: string): Promise<ApiResponse<DeploymentsSummary>> {
    return this.makeRequest<DeploymentsSummary>('/api/deployments/summary', { method: 'GET' }, token);
  }

  static async createDeployment(deploymentData: DeploymentConfig, token?: string): Promise<ApiResponse<Deployment>> {
    return this.makeRequest<Deployment>('/api/deployments', {
      method: 'POST',
      body: JSON.stringify(deploymentData),
    }, token);
  }

  static async deleteDeployment(id: string, token?: string): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/api/deployments/${id}`, { method: 'DELETE' }, token);
  }
}
