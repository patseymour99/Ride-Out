import { prisma } from '../config/database';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';

export async function getNotifications(userId: string, query: { page?: string; limit?: string }) {
  const { page, limit, skip } = getPaginationParams(query);
  const where = { recipientId: userId };
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
  ]);
  return { data: notifications, pagination: buildPaginationMeta(total, page, limit) };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { recipientId: userId, read: false } });
}

export async function markRead(notificationId: string, userId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: userId },
    data: { read: true },
  });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { recipientId: userId, read: false },
    data: { read: true },
  });
}
