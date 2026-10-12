import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const ACCESS_MINUTES = 15;

export interface SessionTokens {
  access: string;
  refresh: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64url');
}

export function newTokens(): SessionTokens {
  const now = Date.now();
  return {
    access: b64url(randomBytes(24)),
    refresh: b64url(randomBytes(32)),
    accessExpiresAt: new Date(now + ACCESS_MINUTES * 60_000),
    refreshExpiresAt: new Date(now + 30 * 24 * 3600_000),
  };
}

export function hashRefresh(refresh: string): string {
  return createHash('sha256').update(refresh).digest('hex');
}

export function refreshMatches(presented: string, storedHash: string): boolean {
  const h = hashRefresh(presented);
  const a = Buffer.from(h, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export const ACCESS_MINUTES_EXPORT = ACCESS_MINUTES;
