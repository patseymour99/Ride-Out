import { apiClient } from './client';
import type { Post, Comment } from '@ride-out/shared';

export const postsApi = {
  getFeed: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: Post[]; pagination: unknown }>('/posts/feed', { params }),

  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: Post[]; pagination: unknown }>('/posts', { params }),

  getUserPosts: (userId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: Post[]; pagination: unknown }>(`/posts/user/${userId}`, { params }),

  create: (data: { content?: string; photoFiles?: File[]; eventId?: string }) => {
    const formData = new FormData();
    if (data.content) formData.append('content', data.content);
    if (data.eventId) formData.append('eventId', data.eventId);
    data.photoFiles?.forEach((f) => formData.append('photos', f));
    return apiClient.post<{ data: Post }>('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  delete: (postId: string) => apiClient.delete(`/posts/${postId}`),

  like: (postId: string) => apiClient.post(`/posts/${postId}/like`),
  unlike: (postId: string) => apiClient.delete(`/posts/${postId}/like`),

  getComments: (postId: string) =>
    apiClient.get<{ data: Comment[] }>(`/posts/${postId}/comments`),

  addComment: (postId: string, content: string) =>
    apiClient.post<{ data: Comment }>(`/posts/${postId}/comments`, { content }),

  deleteComment: (postId: string, commentId: string) =>
    apiClient.delete(`/posts/${postId}/comments/${commentId}`),
};
