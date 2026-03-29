import { Request, Response, NextFunction } from 'express';
import * as eventsService from '../services/events.service';
import path from 'path';

export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await eventsService.listEvents(req.query as any, req.user?.userId);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await eventsService.getEvent(req.params.eventId, req.user?.userId);
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await eventsService.createEvent(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await eventsService.updateEvent(req.params.eventId, req.user!.userId, req.body);
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
}

export async function cancelEvent(req: Request, res: Response, next: NextFunction) {
  try {
    await eventsService.cancelEvent(req.params.eventId, req.user!.userId);
    res.json({ success: true, data: { cancelled: true } });
  } catch (err) { next(err); }
}

export async function joinEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await eventsService.joinEvent(req.params.eventId, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function leaveEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await eventsService.leaveEvent(req.params.eventId, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function uploadGpx(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
      return;
    }
    const gpxUrl = `/uploads/${path.basename(req.file.path)}`;
    const event = await eventsService.updateEventGpx(req.params.eventId, req.user!.userId, gpxUrl);
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
}
