import { Agent, ApiResponse, CreateAgentRequest, UpdateAgentRequest } from '@/types/api';
import { BaseApiClient } from './base';

export class AgentsApiClient extends BaseApiClient {
  static async getAgents(token?: string): Promise<ApiResponse<Agent[]>> {
    return this.makeRequest<Agent[]>('/api/agents', { method: 'GET' }, token);
  }

  static async getAgent(id: string, token?: string): Promise<ApiResponse<Agent>> {
    return this.makeRequest<Agent>(`/api/agents/${id}`, { method: 'GET' }, token);
  }

  static async createAgent(agentData: CreateAgentRequest, token?: string): Promise<ApiResponse<Agent>> {
    return this.makeRequest<Agent>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(agentData),
    }, token);
  }

  static async updateAgent(id: string, agentData: Partial<CreateAgentRequest>, token?: string): Promise<ApiResponse<Agent>> {
    return this.makeRequest<Agent>(`/api/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agentData),
    }, token);
  }

  static async deleteAgent(id: string, token?: string): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/api/agents/${id}`, { method: 'DELETE' }, token);
  }
}
