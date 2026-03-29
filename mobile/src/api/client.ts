import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/auth.store';
import { getTokens } from '../utils/secure-storage';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001') + '/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers!.Authorization = `Bearer ${token}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    const { refreshToken } = await getTokens();
    if (!refreshToken) {
      await useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    try {
      const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefresh } = res.data.data;
      await useAuthStore.getState().setTokens(accessToken, newRefresh);
      processQueue(null, accessToken);
      original.headers!.Authorization = `Bearer ${accessToken}`;
      return apiClient(original);
    } catch (err) {
      processQueue(err, null);
      await useAuthStore.getState().logout();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
