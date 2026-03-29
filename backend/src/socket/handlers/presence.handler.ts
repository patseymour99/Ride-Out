import { Server, Socket } from 'socket.io';
import { SocketEvents } from '@ride-out/shared';

// Simple in-memory presence tracking (use Redis for multi-instance)
const onlineUsers = new Set<string>();

export function registerPresenceHandlers(io: Server, socket: Socket, userId: string) {
  onlineUsers.add(userId);

  // Broadcast online to followers (simplified: broadcast to all)
  io.emit(SocketEvents.PRESENCE_ONLINE, { userId });

  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    io.emit(SocketEvents.PRESENCE_OFFLINE, {
      userId,
      lastSeen: new Date().toISOString(),
    });
  });

  // Client can request who's online
  socket.on('presence:request', () => {
    socket.emit('presence:list', { onlineUsers: Array.from(onlineUsers) });
  });
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}
