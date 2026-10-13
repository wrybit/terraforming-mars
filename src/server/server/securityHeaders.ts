import {Response} from '../Response';

/**
 * Headers every response carries, whichever proxy (or none) sits in front of the server.
 * - nosniff: browsers take the declared content type, e.g. an uploaded logo is never run as a script.
 * - SAMEORIGIN: other sites cannot embed the game invisibly and steer clicks; own pages still can.
 * - same-origin referrer: player ids are in the address and must not reach other sites via links.
 */
export function setSecurityHeaders(res: Response): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'same-origin');
}
