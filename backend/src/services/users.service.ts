import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';

const PUBLIC_USER_SELECT = {
  id: true,
  profile: {
    select: {
      displayName: true,
      avatarUrl: true,
      location: true,
      ridingStyle: true,
    },
  },
};

export async function getMe(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      profile: true,
      bikes: true,
      _count: { select: { followers: true, following: true, hostedEvents: true } },
    },
  });
  return user;
}

export async function getProfile(userId: string, requesterId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      profile: true,
      bikes: true,
      _count: { select: { followers: true, following: true, hostedEvents: true } },
    },
  });

  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

  let isFollowing = false;
  if (requesterId && requesterId !== userId) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: requesterId, followingId: userId } },
    });
    isFollowing = !!follow;
  }

  return { ...user, isFollowing };
}

export async function updateProfile(userId: string, data: {
  displayName?: string;
  bio?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  ridingStyle?: string;
}) {
  const profile = await prisma.profile.upsert({
    where: { userId },
    create: { userId, displayName: data.displayName ?? 'Rider', ...data },
    update: data,
  });
  return profile;
}

export async function updateAvatar(userId: string, avatarUrl: string) {
  return prisma.profile.update({
    where: { userId },
    data: { avatarUrl },
  });
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new AppError(400, 'CANNOT_FOLLOW_SELF', 'You cannot follow yourself');
  }

  const target = await prisma.user.findUnique({ where: { id: followingId } });
  if (!target) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });

  // Notification
  await prisma.notification.create({
    data: {
      recipientId: followingId,
      type: 'NEW_FOLLOWER',
      title: 'New follower',
      data: { followerId },
    },
  });
}

export async function unfollowUser(followerId: string, followingId: string) {
  await prisma.follow.deleteMany({
    where: { followerId, followingId },
  });
}

export async function getFollowers(userId: string, query: { page?: string; limit?: string }) {
  const { page, limit, skip } = getPaginationParams(query);
  const [followers, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { follower: { select: PUBLIC_USER_SELECT } },
    }),
    prisma.follow.count({ where: { followingId: userId } }),
  ]);
  return { data: followers.map((f) => f.follower), pagination: buildPaginationMeta(total, page, limit) };
}

export async function getFollowing(userId: string, query: { page?: string; limit?: string }) {
  const { page, limit, skip } = getPaginationParams(query);
  const [following, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { following: { select: PUBLIC_USER_SELECT } },
    }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { data: following.map((f) => f.following), pagination: buildPaginationMeta(total, page, limit) };
}

export async function searchUsers(query: string, requesterId: string, pagination: { page?: string; limit?: string }) {
  const { page, limit, skip } = getPaginationParams(pagination);
  const where = {
    profile: {
      displayName: { contains: query, mode: 'insensitive' as const },
    },
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        ...PUBLIC_USER_SELECT,
        _count: { select: { followers: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { data: users, pagination: buildPaginationMeta(total, page, limit) };
}
