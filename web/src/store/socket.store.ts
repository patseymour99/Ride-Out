import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@ride-out/shared';
import { useAuthStore } from './auth.store';
import { useNotificationsStore } from './notifications.store';

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

    const socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on(SocketEvents.CONNECT, () => {
      set({ connected: true });
    });

    socket.on(SocketEvents.DISCONNECT, () => {
      set({ connected: false });
    });

    socket.on(SocketEvents.NOTIFICATION_UNREAD_COUNT, ({ count }: { count: number }) => {
      useNotificationsStore.getState().setUnreadCount(count);
    });

    socket.on(SocketEvents.NOTIFICATION_NEW, (notification) => {
      useNotificationsStore.getState().addNotification(notification);
    });

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, connected: false });
  },
}));
