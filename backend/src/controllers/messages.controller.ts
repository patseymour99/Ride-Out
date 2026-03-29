import { Request, Response, NextFunction } from 'express';
import * as messagesService from '../services/messages.service';

export async function getConversations(req: Request, res: Response, next: NextFunction) {
  try {
    const conversations = await messagesService.getConversations(req.user!.userId);
    res.json({ success: true, data: conversations });
  } catch (err) { next(err); }
}

export async function getOrCreateConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const conv = await messagesService.getOrCreateConversation(req.user!.userId, req.body.participantId);
    res.json({ success: true, data: conv });
  } catch (err) { next(err); }
}

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await messagesService.getMessages(req.params.convId, req.user!.userId, req.query as any);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    await messagesService.markConversationRead(req.params.convId, req.user!.userId);
    res.json({ success: true, data: { read: true } });
  } catch (err) { next(err); }
}
