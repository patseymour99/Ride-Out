import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';

const PARTICIPANT_INCLUDE = {
  user: {
    select: {
      id: true,
      profile: { select: { displayName: true, avatarUrl: true, location: true, ridingStyle: true } },
    },
  },
};

export async function getConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId } },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      participants: { include: PARTICIPANT_INCLUDE },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              profile: { select: { displayName: true, avatarUrl: true, location: true, ridingStyle: true } },
            },
          },
        },
      },
    },
  });

  return conversations.map((conv) => {
    const myParticipation = conv.participants.find((p) => p.userId === userId);
    const unreadCount = 0; // simplified; could count messages after lastReadAt
    return {
      ...conv,
      lastMessage: conv.messages[0] ?? null,
      unreadCount,
    };
  });
}

export async function getOrCreateConversation(userId: string, participantId: string) {
  if (userId === participantId) {
    throw new AppError(400, 'INVALID_PARTICIPANT', 'Cannot create conversation with yourself');
  }

  const target = await prisma.user.findUnique({ where: { id: participantId } });
  if (!target) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

  // Check for existing DM
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: participantId } } },
      ],
    },
    include: {
      participants: { include: PARTICIPANT_INCLUDE },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              profile: { select: { displayName: true, avatarUrl: true, location: true, ridingStyle: true } },
            },
          },
        },
      },
    },
  });

  if (existing) return { ...existing, lastMessage: existing.messages[0] ?? null };

  const conv = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId }, { userId: participantId }],
      },
    },
    include: {
      participants: { include: PARTICIPANT_INCLUDE },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              profile: { select: { displayName: true, avatarUrl: true, location: true, ridingStyle: true } },
            },
          },
        },
      },
    },
  });

  return { ...conv, lastMessage: null };
}

export async function getMessages(conversationId: string, userId: string, query: { page?: string; limit?: string }) {
  // Verify user is participant
  const participation = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participation) throw new AppError(403, 'FORBIDDEN', 'You are not part of this conversation');

  const { page, limit, skip } = getPaginationParams(query);
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true, location: true, ridingStyle: true } },
          },
        },
      },
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return {
    data: messages.reverse(), // oldest first
    pagination: buildPaginationMeta(total, page, limit),
  };
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  mediaUrl?: string
) {
  const participation = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: senderId } },
  });
  if (!participation) throw new AppError(403, 'FORBIDDEN', 'You are not part of this conversation');

  const [message] = await Promise.all([
    prisma.message.create({
      data: { conversationId, senderId, content, mediaUrl },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true, location: true, ridingStyle: true } },
          },
        },
      },
    }),
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
  ]);

  return message;
}

export async function markConversationRead(conversationId: string, userId: string) {
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
}
