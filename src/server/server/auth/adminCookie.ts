import {createHmac, timingSafeEqual} from 'crypto';
import {Request} from '../../Request';
import {SESSION_DURATION_MILLISECONDS} from './sessionDuration';

/*
 * Login to the admin pages. The passphrase (SERVER_ID) is sent once in a POST body and never
 * appears in an address again: addresses end up in access logs, the browser history and Referer headers.
 */
export const adminCookieName = 'tmAdmin';
// Same duration as every login (SESSION_DURATION, default 30 days)
export const adminCookieLifetimeSeconds = Math.round(SESSION_DURATION_MILLISECONDS / 1000);

/**
 * The cookie holds the time of the login and a keyed hash over it, not the passphrase: a leaked cookie does not
 * reveal it, a changed SERVER_ID ends every admin login by itself, and a cookie stops working after the login
 * duration even if a browser keeps it longer.
 */
export function adminToken(serverId: string, issuedAtMs: number): string {
  const issuedAt = String(Math.floor(issuedAtMs));
  return issuedAt + '.' + createHmac('sha256', serverId).update('tm-admin-login.' + issuedAt).digest('hex');
}

// Clocks of several servers may differ a little: a login "from the future" is accepted within this tolerance
const CLOCK_TOLERANCE_MS = 60_000;

export function isAdminToken(token: string | undefined, serverId: string, nowMs: number): boolean {
  if (token === undefined) {
    return false;
  }
  const issuedAtMs = Number(token.split('.')[0]);
  if (!Number.isInteger(issuedAtMs) || issuedAtMs > nowMs + CLOCK_TOLERANCE_MS || nowMs - issuedAtMs > adminCookieLifetimeSeconds * 1000) {
    return false;
  }
  const expected = Buffer.from(adminToken(serverId, issuedAtMs));
  const given = Buffer.from(token);
  // Constant time, so the response time does not tell how much of a guess was right
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Compares the passphrase of a login attempt in constant time. */
export function isServerIdGuess(guess: unknown, serverId: string): boolean {
  if (typeof guess !== 'string') {
    return false;
  }
  // Hashing first gives both sides the same length, so the length of the guess does not show either
  const given = createHmac('sha256', 'tm-admin-guess').update(guess).digest();
  const expected = createHmac('sha256', 'tm-admin-guess').update(serverId).digest();
  return timingSafeEqual(given, expected);
}

/**
 * Whether the browser reached the server via https (directly or through a proxy like Caddy).
 * Only then the cookie may be marked Secure: over plain http (e.g. a server in the home network)
 * the browser would drop it and the login would silently fail.
 */
export function isSecureRequest(req: Request): boolean {
  const forwarded = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (protocol !== undefined) {
    return protocol.split(',')[0].trim() === 'https';
  }
  return (req.socket as {encrypted?: boolean}).encrypted === true;
}
