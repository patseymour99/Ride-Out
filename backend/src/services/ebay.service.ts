import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import {
  getEbayAuthUrl,
  exchangeEbayCode,
  refreshEbayToken,
  encryptToken,
  decryptToken,
  EBAY_BASE,
} from '../utils/ebay-oauth';
import { signInviteToken } from '../utils/jwt';
import { env } from '../config/env';
import nodemailer from 'nodemailer';

export function getAuthUrl(state: string): string {
  return getEbayAuthUrl(state);
}

export async function handleCallback(code: string, userId: string) {
  const tokens = await exchangeEbayCode(code);

  // Fetch eBay user identity
  const userRes = await fetch(`${EBAY_BASE}/commerce/identity/v1/user/`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const ebayUser = await userRes.json() as { userId: string };

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await prisma.ebayConnection.upsert({
    where: { userId },
    create: {
      userId,
      ebayUserId: ebayUser.userId,
      accessToken: encryptToken(tokens.access_token),
      refreshToken: encryptToken(tokens.refresh_token),
      tokenExpiresAt: expiresAt,
    },
    update: {
      accessToken: encryptToken(tokens.access_token),
      refreshToken: encryptToken(tokens.refresh_token),
      tokenExpiresAt: expiresAt,
    },
  });

  return { connected: true };
}

export async function disconnectEbay(userId: string) {
  await prisma.ebayConnection.deleteMany({ where: { userId } });
}

async function getValidAccessToken(userId: string): Promise<string> {
  const conn = await prisma.ebayConnection.findUnique({ where: { userId } });
  if (!conn) throw new AppError(400, 'EBAY_NOT_CONNECTED', 'eBay account not connected');

  if (conn.tokenExpiresAt < new Date()) {
    const decryptedRefresh = decryptToken(conn.refreshToken);
    const refreshed = await refreshEbayToken(decryptedRefresh);
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000);
    await prisma.ebayConnection.update({
      where: { userId },
      data: {
        accessToken: encryptToken(refreshed.access_token),
        tokenExpiresAt: newExpiry,
      },
    });
    return refreshed.access_token;
  }

  return decryptToken(conn.accessToken);
}

export async function getActiveListings(userId: string) {
  const token = await getValidAccessToken(userId);
  const res = await fetch(
    `${EBAY_BASE}/sell/inventory/v1/inventory_item?limit=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new AppError(502, 'EBAY_API_ERROR', 'Failed to fetch eBay listings');
  return res.json();
}

export async function syncTransactions(userId: string) {
  const token = await getValidAccessToken(userId);
  const res = await fetch(
    `${EBAY_BASE}/sell/fulfillment/v1/order?limit=50&filter=orderfulfillmentstatus:%7BNOT_STARTED%7CIN_PROGRESS%7D`,
    { headers: { Authorization: `Bearer ${token}`, 'Content-Language': 'en-US' } }
  );
  if (!res.ok) {
    // In sandbox this may return empty — that's OK
    return { synced: 0 };
  }
  const data = await res.json() as { orders?: unknown[] };
  const orders = data.orders ?? [];

  let synced = 0;
  for (const order of orders as any[]) {
    try {
      await prisma.ebayTransaction.upsert({
        where: { ebayTransactionId: order.orderId },
        create: {
          userId,
          ebayTransactionId: order.orderId,
          itemId: order.lineItems?.[0]?.lineItemId ?? '',
          itemTitle: order.lineItems?.[0]?.title ?? 'Unknown item',
          itemPhotoUrl: null,
          soldPrice: parseFloat(order.pricingSummary?.total?.value ?? '0'),
          currency: order.pricingSummary?.total?.currency ?? 'GBP',
          role: 'SELLER',
          counterpartEmail: order.buyer?.username ?? null,
          transactionDate: new Date(order.creationDate),
        },
        update: {},
      });
      synced++;
    } catch {
      // Skip duplicates
    }
  }

  return { synced };
}

export async function getTransactions(userId: string) {
  return prisma.ebayTransaction.findMany({
    where: { userId },
    orderBy: { transactionDate: 'desc' },
  });
}

export async function sendInvite(transactionId: string, userId: string) {
  const tx = await prisma.ebayTransaction.findFirst({
    where: { id: transactionId, userId },
  });
  if (!tx) throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found');
  if (tx.inviteSent) throw new AppError(409, 'INVITE_ALREADY_SENT', 'Invite already sent for this transaction');
  if (!tx.counterpartEmail) throw new AppError(400, 'NO_EMAIL', 'No counterpart email available');

  const inviteToken = signInviteToken({
    invitedByUserId: userId,
    ebayTransactionId: tx.ebayTransactionId,
    email: tx.counterpartEmail,
  });

  const inviteUrl = `${env.WEB_URL}/join?t=${inviteToken}`;

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: tx.counterpartEmail,
    subject: `You've been invited to join Ride-Out`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1a1a1a;color:#f0f0f0;padding:32px;border-radius:12px;">
        <h1 style="color:#FF6B00;font-size:28px;margin-bottom:8px;">Ride-Out</h1>
        <p>You recently completed an eBay transaction for <strong>${tx.itemTitle}</strong>.</p>
        <p>The other party has invited you to join <strong>Ride-Out</strong> — the community for motorcycle riders.</p>
        <a href="${inviteUrl}" style="display:inline-block;background:#FF6B00;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
          Join Ride-Out
        </a>
        <p style="color:#888;font-size:12px;margin-top:24px;">This invite expires in 7 days.</p>
      </div>
    `,
  });

  await prisma.ebayTransaction.update({
    where: { id: transactionId },
    data: { inviteSent: true },
  });

  return { sent: true };
}

export async function searchEbay(keyword: string) {
  // Uses eBay Browse API (no auth required for search)
  const appToken = Buffer.from(`${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`).toString('base64');
  const tokenRes = await fetch(`${EBAY_BASE}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${appToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
  });
  if (!tokenRes.ok) throw new AppError(502, 'EBAY_API_ERROR', 'Failed to get eBay app token');
  const { access_token } = await tokenRes.json() as { access_token: string };

  const searchRes = await fetch(
    `${EBAY_BASE}/buy/browse/v1/item_summary/search?q=${encodeURIComponent(keyword + ' motorcycle')}&limit=20&category_ids=6000`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  if (!searchRes.ok) throw new AppError(502, 'EBAY_API_ERROR', 'eBay search failed');
  return searchRes.json();
}
