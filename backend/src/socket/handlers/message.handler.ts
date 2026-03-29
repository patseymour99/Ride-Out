import { Server, Socket } from 'socket.io';
import { SocketEvents } from '@ride-out/shared';
import * as messagesService from '../../services/messages.service';

export function registerMessageHandlers(io: Server, socket: Socket, userId: string) {
  socket.on(SocketEvents.MESSAGE_SEND, async (data: {
    conversationId: string;
    content: string;
    mediaUrl?: string;
  }) => {
    try {
      const message = await messagesService.sendMessage(
        data.conversationId,
        userId,
        data.content,
        data.mediaUrl
      );

      // Broadcast to all participants in the conversation
      io.to(`conversation:${data.conversationId}`).emit(SocketEvents.MESSAGE_NEW, message);
    } catch (err) {
      socket.emit('error', { message: (err as Error).message });
    }
  });

  socket.on(SocketEvents.MESSAGE_TYPING, (data: { conversationId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit(SocketEvents.MESSAGE_TYPING, {
      conversationId: data.conversationId,
      userId,
    });
  });

  socket.on(SocketEvents.MESSAGE_READ, async (data: {
    conversationId: string;
    messageId: string;
  }) => {
    try {
      await messagesService.markConversationRead(data.conversationId, userId);
      socket.to(`conversation:${data.conversationId}`).emit(SocketEvents.MESSAGE_READ_RECEIPT, {
        conversationId: data.conversationId,
        userId,
        readAt: new Date().toISOString(),
      });
    } catch (err) {
      socket.emit('error', { message: (err as Error).message });
    }
  });

  // Join conversation rooms
  socket.on('conversation:join', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('conversation:leave', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
  });
}
