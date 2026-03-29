import { apiClient } from './client';
import type { UserProfile, UpdateProfileInput } from '@ride-out/shared';

export const usersApi = {
  getMe: () => apiClient.get<{ data: UserProfile }>('/users/me'),

  updateMe: (data: UpdateProfileInput) =>
    apiClient.put<{ data: unknown }>('/users/me', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getProfile: (userId: string) =>
    apiClient.get<{ data: UserProfile }>(`/users/${userId}`),

  follow: (userId: string) => apiClient.post(`/users/${userId}/follow`),
  unfollow: (userId: string) => apiClient.delete(`/users/${userId}/follow`),

  getFollowers: (userId: string) =>
    apiClient.get(`/users/${userId}/followers`),

  getFollowing: (userId: string) =>
    apiClient.get(`/users/${userId}/following`),

  search: (q: string) =>
    apiClient.get('/users/search', { params: { q } }),
};
