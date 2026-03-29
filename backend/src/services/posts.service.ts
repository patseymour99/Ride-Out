import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { getPaginationParams, buildPaginationMeta } from '../utils/pagination';

const POST_INCLUDE = (userId?: string) => ({
  author: {
    select: {
      id: true,
      profile: { select: { displayName: true, avatarUrl: true, location: true, ridingStyle: true } },
    },
  },
  _count: { select: { likes: true, comments: true } },
});

export async function getFeed(userId: string, query: { page?: string; limit?: string }) {
  const { page, limit, skip } = getPaginationParams(query);

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = [userId, ...following.map((f) => f.followingId)];

  const where = { authorId: { in: followingIds } };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: POST_INCLUDE(),
    }),
    prisma.post.count({ where }),
  ]);

  const likedPostIds = await getLikedPostIds(userId, posts.map((p) => p.id));
  return {
    data: posts.map((p) => ({ ...p, isLiked: likedPostIds.has(p.id) })),
    pagination: buildPaginationMeta(total, page, limit),
  };
}

export async function getAllPosts(query: { page?: string; limit?: string }, userId?: string) {
  const { page, limit, skip } = getPaginationParams(query);
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: POST_INCLUDE(),
    }),
    prisma.post.count(),
  ]);

  const likedPostIds = userId ? await getLikedPostIds(userId, posts.map((p) => p.id)) : new Set<string>();
  return {
    data: posts.map((p) => ({ ...p, isLiked: likedPostIds.has(p.id) })),
    pagination: buildPaginationMeta(total, page, limit),
  };
}

export async function getUserPosts(targetUserId: string, query: { page?: string; limit?: string }, requesterId?: string) {
  const { page, limit, skip } = getPaginationParams(query);
  const where = { authorId: targetUserId };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: POST_INCLUDE() }),
    prisma.post.count({ where }),
  ]);

  const likedPostIds = requesterId ? await getLikedPostIds(requesterId, posts.map((p) => p.id)) : new Set<string>();
  return {
    data: posts.map((p) => ({ ...p, isLiked: likedPostIds.has(p.id) })),
    pagination: buildPaginationMeta(total, page, limit),
  };
}

export async function createPost(authorId: string, data: {
  content?: string;
  photoUrls?: string[];
  eventId?: string;
}) {
  if (!data.content && (!data.photoUrls || data.photoUrls.length === 0)) {
    throw new AppError(400, 'EMPTY_POST', 'Post must have content or photos');
  }

  const type = data.photoUrls && data.photoUrls.length > 0 ? 'PHOTO' : data.eventId ? 'RIDE_SHARE' : 'TEXT';

  return prisma.post.create({
    data: {
      authorId,
      type: type as any,
      content: data.content,
      photoUrls: data.photoUrls ?? [],
      eventId: data.eventId,
    },
    include: POST_INCLUDE(),
  });
}

export async function deletePost(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError(404, 'POST_NOT_FOUND', 'Post not found');
  if (post.authorId !== userId) throw new AppError(403, 'FORBIDDEN', 'You can only delete your own posts');
  await prisma.post.delete({ where: { id: postId } });
}

export async function likePost(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError(404, 'POST_NOT_FOUND', 'Post not found');

  await prisma.like.upsert({
    where: { postId_userId: { postId, userId } },
    create: { postId, userId },
    update: {},
  });

  if (post.authorId !== userId) {
    await prisma.notification.create({
      data: {
        recipientId: post.authorId,
        type: 'POST_LIKED',
        title: 'Someone liked your post',
        data: { postId, userId },
      },
    });
  }
}

export async function unlikePost(postId: string, userId: string) {
  await prisma.like.deleteMany({ where: { postId, userId } });
}

export async function getComments(postId: string, query: { page?: string; limit?: string }) {
  const { page, limit, skip } = getPaginationParams(query);
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError(404, 'POST_NOT_FOUND', 'Post not found');

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { postId },
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            profile: { select: { displayName: true, avatarUrl: true, location: true, ridingStyle: true } },
          },
        },
      },
    }),
    prisma.comment.count({ where: { postId } }),
  ]);

  return { data: comments, pagination: buildPaginationMeta(total, page, limit) };
}

export async function addComment(postId: string, authorId: string, content: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError(404, 'POST_NOT_FOUND', 'Post not found');

  const comment = await prisma.comment.create({
    data: { postId, authorId, content },
    include: {
      author: {
        select: {
          id: true,
          profile: { select: { displayName: true, avatarUrl: true, location: true, ridingStyle: true } },
        },
      },
    },
  });

  if (post.authorId !== authorId) {
    await prisma.notification.create({
      data: {
        recipientId: post.authorId,
        type: 'POST_COMMENTED',
        title: 'New comment on your post',
        data: { postId, commentId: comment.id, authorId },
      },
    });
  }

  return comment;
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new AppError(404, 'COMMENT_NOT_FOUND', 'Comment not found');
  if (comment.authorId !== userId) throw new AppError(403, 'FORBIDDEN', 'You can only delete your own comments');
  await prisma.comment.delete({ where: { id: commentId } });
}

async function getLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
  const likes = await prisma.like.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });
  return new Set(likes.map((l) => l.postId));
}
