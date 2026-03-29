import { create } from 'zustand';
import { saveTokens, clearTokens } from '../utils/secure-storage';
import type { UserProfile } from '@ride-out/shared';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserProfile, accessToken: string, refreshToken: string) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: UserProfile) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await saveTokens(accessToken, refreshToken);
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  setTokens: async (accessToken, refreshToken) => {
    await saveTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken });
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await clearTokens();
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));
