import crypto from 'crypto';
import { env } from '../config/env';

const EBAY_BASE =
  env.EBAY_ENVIRONMENT === 'production'
    ? 'https://api.ebay.com'
    : 'https://api.sandbox.ebay.com';

const EBAY_AUTH_BASE =
  env.EBAY_ENVIRONMENT === 'production'
    ? 'https://auth.ebay.com'
    : 'https://auth.sandbox.ebay.com';

export function getEbayAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.EBAY_CLIENT_ID ?? '',
    redirect_uri: env.EBAY_RUNAME ?? '',
    response_type: 'code',
    scope: [
      'https://api.ebay.com/oauth/api_scope',
      'https://api.ebay.com/oauth/api_scope/sell.account',
      'https://api.ebay.com/oauth/api_scope/commerce.transaction',
    ].join(' '),
    state,
  });
  return `${EBAY_AUTH_BASE}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeEbayCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const credentials = Buffer.from(
    `${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${EBAY_BASE}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.EBAY_RUNAME ?? '',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`eBay token exchange failed: ${err}`);
  }

  return res.json();
}

export async function refreshEbayToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const credentials = Buffer.from(
    `${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${EBAY_BASE}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: 'https://api.ebay.com/oauth/api_scope',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`eBay token refresh failed: ${err}`);
  }

  return res.json();
}

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const hex = env.EBAY_TOKEN_ENCRYPTION_KEY ?? '';
  if (hex.length < KEY_LENGTH * 2) {
    // Fallback to a derived key in dev (do NOT use in production)
    return crypto.scryptSync('dev-key', 'salt', KEY_LENGTH);
  }
  return Buffer.from(hex, 'hex');
}

export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptToken(ciphertext: string): string {
  const [ivHex, encHex] = ciphertext.split(':');
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

export { EBAY_BASE };
