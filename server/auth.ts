import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const COOKIE_NAME = 'ac_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

// Derived server-side only; never exposed to client JS
const rawPassword = process.env.ADMIN_PASSWORD || 'AineChris@Admin2026';
const passwordSalt = crypto.randomBytes(16).toString('hex');
const passwordHash = crypto.scryptSync(rawPassword, passwordSalt, 64);

const sessionSecret =
  process.env.ADMIN_SESSION_SECRET ||
  crypto.createHmac('sha256', 'ac-portfolio-dev-key').update(rawPassword).digest('hex');

export function verifyAdminPassword(candidate: string): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const candidateHash = crypto.scryptSync(candidate, passwordSalt, 64);
  return crypto.timingSafeEqual(candidateHash, passwordHash);
}

interface SessionPayload {
  role: 'admin';
  exp: number;
}

export function createSessionToken(): string {
  const payload: SessionPayload = {
    role: 'admin',
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', sessionSecret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', sessionSecret).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (parsed.role !== 'admin' || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const segment of cookieHeader.split(';')) {
    const idx = segment.indexOf('=');
    if (idx === -1) continue;
    const key = segment.slice(0, idx).trim();
    const val = segment.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  }
  return out;
}

function isHttpsRequest(req?: Request): boolean {
  if (!req) return process.env.NODE_ENV === 'production';
  const proto = req.headers['x-forwarded-proto'];
  const protoStr = Array.isArray(proto) ? proto[0] : proto;
  return Boolean(req.secure || (protoStr && protoStr.includes('https')));
}

export function setSessionCookie(res: Response, token: string, req?: Request): void {
  const isHttps = isHttpsRequest(req);
  const flags = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (isHttps) {
    flags.push('Secure', 'Partitioned');
  }
  res.setHeader('Set-Cookie', flags.join('; '));
}

export function clearSessionCookie(res: Response, req?: Request): void {
  const isHttps = isHttpsRequest(req);
  const flags = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isHttps) {
    flags.push('Secure', 'Partitioned');
  }
  res.setHeader('Set-Cookie', flags.join('; '));
}

export function isRequestAuthenticated(req: Request): boolean {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[COOKIE_NAME]) !== null;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!isRequestAuthenticated(req)) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}
