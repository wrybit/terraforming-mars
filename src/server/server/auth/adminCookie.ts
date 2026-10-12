import {createHmac, timingSafeEqual} from 'crypto';
import {Request} from '../../Request';

/*
 * Login to the admin pages. The passphrase (SERVER_ID) is sent once in a POST body and never
 * appears in an address again: addresses end up in access logs, the browser history and Referer headers.
 */
export const adminCookieName = 'tmAdmin';
export const adminCookieLifetimeSeconds = 30 * 24 * 60 * 60;

/**
 * The cookie holds a keyed hash of the passphrase, not the passphrase itself: a leaked cookie does not
 * reveal it, and a changed SERVER_ID ends every admin login by itself.
 */
export function adminToken(serverId: string): string {
  return createHmac('sha256', serverId).update('tm-admin-login').digest('hex');
}

export function isAdminToken(token: string | undefined, serverId: string): boolean {
  if (token === undefined) {
    return false;
  }
  const expected = Buffer.from(adminToken(serverId));
  const given = Buffer.from(token);
  // Constant time, so the response time does not tell how much of a guess was right
  return given.length === expected.length && timingSafeEqual(given, expected);
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
