import { ApiResponse, Resource } from '@/types/api';
import { BaseApiClient } from './base';

export class ResourcesApiClient extends BaseApiClient {
  static async getResources(params?: { agentId?: string; status?: string; type?: string }, token?: string): Promise<ApiResponse<Resource[]>> {
    const query = new URLSearchParams();
    if (params?.agentId) query.append('agentId', params.agentId);
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    const qs = query.toString();
    return this.makeRequest<Resource[]>(`/api/resources${qs ? `?${qs}` : ''}`, { method: 'GET' }, token);
  }

  static async getResource(id: string, token?: string): Promise<ApiResponse<Resource>> {
    return this.makeRequest<Resource>(`/api/resources/${id}`, { method: 'GET' }, token);
  }

  static async uploadResource(file: File, linkedAgents?: string[], token?: string): Promise<ApiResponse<Resource>> {
    const formData = new FormData();
    formData.append('file', file);
    if (linkedAgents) {
      for (const agentId of linkedAgents) formData.append('linkedAgents', agentId);
    }
    return this.makeRequest<Resource>('/api/resources', { method: 'POST', body: formData }, token);
  }

  static async updateResource(id: string, data: Partial<Resource>, token?: string): Promise<ApiResponse<Resource>> {
    return this.makeRequest<Resource>(`/api/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token);
  }

  static async deleteResource(id: string, token?: string): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/api/resources/${id}`, { method: 'DELETE' }, token);
  }
}
