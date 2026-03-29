import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string };
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: 'TOKEN_INVALID', message: 'Invalid or expired access token' } });
  }
}
