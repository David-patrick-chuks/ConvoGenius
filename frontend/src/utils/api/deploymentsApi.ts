import { ApiResponse, Deployment, DeploymentConfig } from '@/types/api';
import { BaseApiClient } from './base';

export class DeploymentsApiClient extends BaseApiClient {
  static async getDeployments(agentId?: string, platform?: string): Promise<ApiResponse<Deployment[]>> {
    const params = new URLSearchParams();
    if (agentId) params.append('agentId', agentId);
    if (platform) params.append('platform', platform);
    
    const queryString = params.toString();
    return this.get<Deployment[]>(`/deployments${queryString ? `?${queryString}` : ''}`, '');
  }

  static async createDeployment(deploymentData: DeploymentConfig): Promise<ApiResponse<Deployment>> {
    return this.post<Deployment>('/deployments', '', deploymentData);
  }

  static async updateDeployment(deploymentId: string, deploymentData: Partial<Deployment>): Promise<ApiResponse<Deployment>> {
    return this.put<Deployment>(`/deployments?id=${deploymentId}`, '', deploymentData);
  }

  static async deleteDeployment(deploymentId: string): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/deployments?id=${deploymentId}`, {
      method: 'DELETE',
    });
  }

  static async getAvailablePlatforms(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>('/deployments', {
      method: 'OPTIONS',
    });
  }
}
