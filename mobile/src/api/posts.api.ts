import { apiClient } from './client';
import type { Post } from '@ride-out/shared';

export const postsApi = {
  getFeed: (params?: { page?: number }) =>
    apiClient.get<{ data: Post[] }>('/posts/feed', { params }),
  create: (data: { content?: string }) =>
    apiClient.post<{ data: Post }>('/posts', data),
  like: (postId: string) => apiClient.post(`/posts/${postId}/like`),
  unlike: (postId: string) => apiClient.delete(`/posts/${postId}/like`),
  getUserPosts: (userId: string) => apiClient.get<{ data: Post[] }>(`/posts/user/${userId}`),
};
