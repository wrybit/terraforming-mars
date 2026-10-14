import {Request} from '../Request';

/**
 * True when a browser sent the request from another site.
 *
 * Login cookies (admin, Discord) go along with every request, also with a form another site submits.
 * Browsers name the sending page in Origin (or at least Referer); if it is not this server, the request
 * did not come from our own pages. Requests without both headers come from scripts and tools, not from
 * a foreign page in a browser, so they pass.
 */
export function isCrossSiteRequest(req: Request): boolean {
  const source = req.headers.origin ?? req.headers.referer;
  if (source === undefined) {
    return false;
  }
  // "null": sandboxed frames and local files, never our own pages
  if (source === 'null') {
    return true;
  }
  try {
    return new URL(source).host !== req.headers.host;
  } catch {
    return true;
  }
}
