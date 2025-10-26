import { ApiResponse, Resource } from '@/types/api';
import { BaseApiClient } from './base';

export class ResourcesApiClient extends BaseApiClient {
  static async getResources(agentId?: string, type?: string): Promise<ApiResponse<Resource[]>> {
    const params = new URLSearchParams();
    if (agentId) params.append('agentId', agentId);
    if (type) params.append('type', type);
    
    const queryString = params.toString();
    return this.get<Resource[]>(`/resources${queryString ? `?${queryString}` : ''}`, '');
  }

  static async getResource(resourceId: string): Promise<ApiResponse<Resource>> {
    return this.get<Resource>(`/resources?id=${resourceId}`, '');
  }

  static async uploadResource(file: File, linkedAgents?: string[]): Promise<ApiResponse<Resource>> {
    const formData = new FormData();
    formData.append('file', file);
    if (linkedAgents) {
      formData.append('linkedAgents', JSON.stringify(linkedAgents));
    }

    return this.makeRequest<Resource>('/resources', {
      method: 'POST',
      body: formData,
    });
  }

  static async updateResource(resourceId: string, resourceData: Partial<Resource>): Promise<ApiResponse<Resource>> {
    return this.put<Resource>(`/resources?id=${resourceId}`, '', resourceData);
  }

  static async deleteResource(resourceId: string): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/resources?id=${resourceId}`, {
      method: 'DELETE',
    });
  }
}
