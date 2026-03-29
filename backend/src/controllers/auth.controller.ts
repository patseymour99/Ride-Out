import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, displayName } = req.body;
    const result = await authService.register(email, password, displayName);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: { code: 'MISSING_TOKEN', message: 'refreshToken required' } });
      return;
    }
    const tokens = await authService.refresh(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) { next(err); }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await authService.logout(refreshToken);
    res.json({ success: true, data: { message: 'Logged out' } });
  } catch (err) { next(err); }
}

export function googleCallback(req: Request, res: Response) {
  const user = req.user as any;
  if (!user?.tokens) {
    res.redirect(`${process.env.WEB_URL}/login?error=oauth_failed`);
    return;
  }
  const { accessToken, refreshToken } = user.tokens;
  res.redirect(
    `${process.env.WEB_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
  );
}
