import { Agent, ApiResponse, CreateAgentRequest, UpdateAgentRequest } from '@/types/api';
import { BaseApiClient } from './base';

export class AgentsApiClient extends BaseApiClient {
  static async getAgents(): Promise<ApiResponse<Agent[]>> {
    return this.get<Agent[]>('/agents', '');
  }

  static async getAgent(agentId: string): Promise<ApiResponse<Agent>> {
    return this.get<Agent>(`/agents?id=${agentId}`, '');
  }

  static async createAgent(agentData: CreateAgentRequest): Promise<ApiResponse<Agent>> {
    return this.post<Agent>('/agents', '', agentData);
  }

  static async updateAgent(agentData: UpdateAgentRequest): Promise<ApiResponse<Agent>> {
    return this.put<Agent>('/agents', '', agentData);
  }

  static async deleteAgent(agentId: string): Promise<ApiResponse<null>> {
    return this.makeRequest<null>(`/agents?id=${agentId}`, {
      method: 'DELETE',
    });
  }
}
