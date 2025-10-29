import { ApiResponse, ChatMessage, SendMessageRequest } from '@/types/api';
import { BaseApiClient } from './base';

export class ChatApiClient extends BaseApiClient {
  static async sendMessage(messageData: SendMessageRequest, token?: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(messageData),
    }, token);
  }

  static async getSessions(params?: { agentId?: string; limit?: number }, token?: string): Promise<ApiResponse<any[]>> {
    const query = new URLSearchParams();
    if (params?.agentId) query.append('agentId', params.agentId);
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString();
    return this.makeRequest<any[]>(`/api/chat/sessions${qs ? `?${qs}` : ''}`, { method: 'GET' }, token);
  }

  static async getSessionMessages(sessionId: string, token?: string): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(`/api/chat/sessions/${sessionId}`, { method: 'GET' }, token);
  }
}
