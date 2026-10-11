import {APP_NAME} from '@/common/constants';

// How this server presents itself (TITLE_LONG, TITLE_SHORT, SERVER_NAME in its .env): the server writes it into
// index.html as meta tags (server/serverIdentity.ts); without them (tests, other hosts) the defaults apply
function meta(name: string): string | undefined {
  const content = typeof document === 'undefined' ? undefined : document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content.trim();
  return content === '' ? undefined : content;
}

/** Start page and pages without their own title, e.g. "Terraforming Mars" */
export const titleLong = (): string => meta('server-title-long') ?? APP_NAME;
/** End of all other tab titles, e.g. "Cards List | TM" */
export const titleShort = (): string => meta('server-title-short') ?? 'TM';
/** Under the start page title; undefined: nothing shown */
export const serverName = (): string | undefined => meta('server-name');
