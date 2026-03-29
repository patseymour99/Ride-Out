import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/error.middleware';
import { v4 as uuidv4 } from 'uuid';

export async function register(email: string, password: string, displayName: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: {
        create: { displayName },
      },
    },
    include: { profile: true },
  });

  const tokens = await generateTokens(user.id, user.email);
  return { user, tokens };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user || !user.passwordHash) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const tokens = await generateTokens(user.id, user.email);
  return { user, tokens };
}

export async function refresh(refreshToken: string) {
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, 'REFRESH_TOKEN_EXPIRED', 'Refresh token has expired');
  }

  // Rotate: delete old, create new
  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: payload.userId },
    select: { id: true, email: true },
  });

  return generateTokens(user.id, user.email);
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

export async function findOrCreateGoogleUser(googleId: string, email: string, displayName: string, avatarUrl?: string) {
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
    include: { profile: true },
  });

  if (user && !user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId },
      include: { profile: true },
    });
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        googleId,
        emailVerified: true,
        profile: {
          create: {
            displayName,
            avatarUrl: avatarUrl ?? null,
          },
        },
      },
      include: { profile: true },
    });
  }

  const tokens = await generateTokens(user.id, user.email);
  return { user, tokens };
}

async function generateTokens(userId: string, email: string) {
  const accessToken = signAccessToken({ userId, email });
  const rawRefresh = uuidv4();
  const refreshToken = signRefreshToken({ userId });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { userId, token: refreshToken, expiresAt },
  });

  return { accessToken, refreshToken };
}
