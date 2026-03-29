import { Request, Response, NextFunction } from 'express';
import * as usersService from '../services/users.service';
import path from 'path';

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getMe(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await usersService.updateProfile(req.user!.userId, req.body);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
      return;
    }
    const avatarUrl = `/uploads/${path.basename(req.file.path)}`;
    const profile = await usersService.updateAvatar(req.user!.userId, avatarUrl);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await usersService.getProfile(req.params.userId, req.user?.userId);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

export async function follow(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.followUser(req.user!.userId, req.params.userId);
    res.json({ success: true, data: { following: true } });
  } catch (err) { next(err); }
}

export async function unfollow(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.unfollowUser(req.user!.userId, req.params.userId);
    res.json({ success: true, data: { following: false } });
  } catch (err) { next(err); }
}

export async function getFollowers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.getFollowers(req.params.userId, req.query as any);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getFollowing(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.getFollowing(req.params.userId, req.query as any);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function searchUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) ?? '';
    const result = await usersService.searchUsers(q, req.user!.userId, req.query as any);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}
