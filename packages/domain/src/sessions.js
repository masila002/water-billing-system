import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const ACCESS_MINUTES = 15;

function b64url(buf) {
  return buf.toString('base64url');
}

export function newTokens() {
  const now = Date.now();
  return {
    access: b64url(randomBytes(24)),
    refresh: b64url(randomBytes(32)),
    accessExpiresAt: new Date(now + ACCESS_MINUTES * 60_000),
    refreshExpiresAt: new Date(now + 30 * 24 * 3600_000),
  };
}

export function hashRefresh(refresh) {
  return createHash('sha256').update(refresh).digest('hex');
}

export function refreshMatches(presented, storedHash) {
  const h = hashRefresh(presented);
  const a = Buffer.from(h, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export { ACCESS_MINUTES };
