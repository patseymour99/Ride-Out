import { apiClient } from './client';
import type { Conversation, Message } from '@ride-out/shared';

export const messagesApi = {
  getConversations: () =>
    apiClient.get<{ data: Conversation[] }>('/messages/conversations'),

  getOrCreate: (participantId: string) =>
    apiClient.post<{ data: Conversation }>('/messages/conversations', { participantId }),

  getMessages: (convId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: Message[]; pagination: unknown }>(`/messages/conversations/${convId}/messages`, { params }),

  markRead: (convId: string) =>
    apiClient.post(`/messages/conversations/${convId}/read`),
};
