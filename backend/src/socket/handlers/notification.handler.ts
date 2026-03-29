import { Server, Socket } from 'socket.io';
import { SocketEvents } from '@ride-out/shared';
import * as notificationsService from '../../services/notifications.service';

export function registerNotificationHandlers(io: Server, socket: Socket, userId: string) {
  // Send unread count on connect
  notificationsService.getUnreadCount(userId).then((count) => {
    socket.emit(SocketEvents.NOTIFICATION_UNREAD_COUNT, { count });
  });

  socket.on(SocketEvents.NOTIFICATION_READ, async (data: { notificationId: string }) => {
    try {
      await notificationsService.markRead(data.notificationId, userId);
      const count = await notificationsService.getUnreadCount(userId);
      socket.emit(SocketEvents.NOTIFICATION_UNREAD_COUNT, { count });
    } catch (err) {
      socket.emit('error', { message: (err as Error).message });
    }
  });
}
