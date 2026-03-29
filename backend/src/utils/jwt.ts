import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
}

export function signInviteToken(payload: {
  invitedByUserId: string;
  ebayTransactionId: string;
  email: string;
}): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '7d' });
}

export function verifyInviteToken(token: string): {
  invitedByUserId: string;
  ebayTransactionId: string;
  email: string;
} {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as {
    invitedByUserId: string;
    ebayTransactionId: string;
    email: string;
  };
}
