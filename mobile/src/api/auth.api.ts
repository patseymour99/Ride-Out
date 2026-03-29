import { apiClient } from './client';
import type { AuthTokens } from '@ride-out/shared';

export const authApi = {
  register: (email: string, password: string, displayName: string) =>
    apiClient.post<{ data: { user: unknown; tokens: AuthTokens } }>('/auth/register', { email, password, displayName }),
  login: (email: string, password: string) =>
    apiClient.post<{ data: { user: unknown; tokens: AuthTokens } }>('/auth/login', { email, password }),
  logout: (refreshToken: string) => apiClient.post('/auth/logout', { refreshToken }),
};
