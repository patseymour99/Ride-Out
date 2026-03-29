import { apiClient } from './client';
import type { UserProfile, UpdateProfileInput } from '@ride-out/shared';

export const usersApi = {
  getMe: () => apiClient.get<{ data: UserProfile }>('/users/me'),
  updateMe: (data: UpdateProfileInput) => apiClient.put('/users/me', data),
  getProfile: (userId: string) => apiClient.get<{ data: UserProfile }>(`/users/${userId}`),
  follow: (userId: string) => apiClient.post(`/users/${userId}/follow`),
  unfollow: (userId: string) => apiClient.delete(`/users/${userId}/follow`),
  search: (q: string) => apiClient.get('/users/search', { params: { q } }),
};
