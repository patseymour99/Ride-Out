import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { SocketEvents } from '@ride-out/shared';
import { registerMessageHandlers } from './handlers/message.handler';
import { registerNotificationHandlers } from './handlers/notification.handler';
import { registerPresenceHandlers } from './handlers/presence.handler';
import { corsOptions } from '../config/cors';

export let io: SocketServer;

export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyAccessToken(token);
      (socket as any).userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    console.log(`Socket connected: ${socket.id} (user: ${userId})`);

    // Join personal room
    socket.join(`user:${userId}`);

    registerMessageHandlers(io, socket, userId);
    registerNotificationHandlers(io, socket, userId);
    registerPresenceHandlers(io, socket, userId);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Helper to emit to a user's personal room
export function emitToUser(userId: string, event: string, data: unknown) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

// Helper to emit to an event room
export function emitToEvent(eventId: string, event: string, data: unknown) {
  if (io) {
    io.to(`event:${eventId}`).emit(event, data);
  }
}
