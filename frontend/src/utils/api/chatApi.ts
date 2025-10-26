import { ApiResponse, ChatMessage, SendMessageRequest } from '@/types/api';
import { BaseApiClient } from './base';

export class ChatApiClient extends BaseApiClient {
  static async getMessages(agentId: string): Promise<ApiResponse<ChatMessage[]>> {
    return this.get<ChatMessage[]>(`/chat?agentId=${agentId}`, '');
  }

  static async sendMessage(messageData: SendMessageRequest): Promise<ApiResponse<ChatMessage>> {
    return this.post<ChatMessage>('/chat', '', messageData);
  }
}
