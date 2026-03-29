import { Request, Response, NextFunction } from 'express';
import * as notificationsService from '../services/notifications.service';

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await notificationsService.getNotifications(req.user!.userId, req.query as any);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationsService.markRead(req.params.notifId, req.user!.userId);
    res.json({ success: true, data: { read: true } });
  } catch (err) { next(err); }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await notificationsService.markAllRead(req.user!.userId);
    res.json({ success: true, data: { read: true } });
  } catch (err) { next(err); }
}
