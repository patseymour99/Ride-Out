import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth.store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,

  connect: () => {
    if (get().socket) return;
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, connected: false });
  },
}));
