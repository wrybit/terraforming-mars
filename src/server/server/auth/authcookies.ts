import {Request} from '../../Request';

export const sessionIdCookieName = 'sessionId';

/** Value of the cookie |name| of the request, or undefined when the request does not carry it. */
export function readCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie;

  if (cookieHeader) {
    for (const cookie of cookieHeader.split(';')) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) {
        return value;
      }
    }
  }
  return undefined;
}

export function extract(req: Request) {
  return readCookie(req, sessionIdCookieName);
}
