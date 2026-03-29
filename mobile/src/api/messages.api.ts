import { apiClient } from './client';
import type { Conversation, Message } from '@ride-out/shared';

export const messagesApi = {
  getConversations: () =>
    apiClient.get<{ data: Conversation[] }>('/messages/conversations'),
  getOrCreate: (participantId: string) =>
    apiClient.post<{ data: Conversation }>('/messages/conversations', { participantId }),
  getMessages: (convId: string) =>
    apiClient.get<{ data: Message[] }>(`/messages/conversations/${convId}/messages`),
  markRead: (convId: string) =>
    apiClient.post(`/messages/conversations/${convId}/read`),
};
