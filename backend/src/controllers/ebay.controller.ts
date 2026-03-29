import { Request, Response, NextFunction } from 'express';
import * as ebayService from '../services/ebay.service';
import { v4 as uuidv4 } from 'uuid';

export function authRedirect(req: Request, res: Response) {
  const state = uuidv4();
  const url = ebayService.getAuthUrl(state);
  res.redirect(url);
}

export async function authCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.query as { code: string };
    if (!code) {
      res.status(400).json({ success: false, error: { code: 'MISSING_CODE', message: 'Authorization code missing' } });
      return;
    }
    await ebayService.handleCallback(code, req.user!.userId);
    res.redirect(`${process.env.WEB_URL}/ebay?connected=true`);
  } catch (err) { next(err); }
}

export async function disconnect(req: Request, res: Response, next: NextFunction) {
  try {
    await ebayService.disconnectEbay(req.user!.userId);
    res.json({ success: true, data: { disconnected: true } });
  } catch (err) { next(err); }
}

export async function getListings(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await ebayService.getActiveListings(req.user!.userId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const transactions = await ebayService.getTransactions(req.user!.userId);
    res.json({ success: true, data: transactions });
  } catch (err) { next(err); }
}

export async function syncTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ebayService.syncTransactions(req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function sendInvite(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ebayService.sendInvite(req.params.txId, req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function searchEbay(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string) ?? 'motorcycle';
    const data = await ebayService.searchEbay(q);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
