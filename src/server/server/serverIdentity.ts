import {APP_NAME} from '../../common/constants';

// How this server presents itself, set in its .env: tab titles and a name under the start page title.
// Written into index.html (ServeAsset.ts), so the very first frame already has the right tab title.
export type ServerIdentity = {
  /** Tab title of the start page and pages without their own title, e.g. "Terraforming Mars" */
  titleLong: string,
  /** End of all other tab titles, e.g. "Cards List | TM" */
  titleShort: string,
  /** Shown under the start page title; empty: nothing shown */
  name: string,
};

export function serverIdentity(environment: Record<string, string | undefined> = process.env): ServerIdentity {
  return {
    titleLong: environment.TITLE_LONG?.trim() || APP_NAME,
    titleShort: environment.TITLE_SHORT?.trim() || 'TM',
    name: environment.SERVER_NAME?.trim() ?? '',
  };
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** index.html with <title> and the identity as meta tags (read by the client in serverIdentity.ts). */
export function withServerIdentity(html: string, identity: ServerIdentity = serverIdentity()): string {
  const tags = [
    `<title>${escapeHtml(identity.titleLong)}</title>`,
    `<meta name="server-title-long" content="${escapeHtml(identity.titleLong)}" />`,
    `<meta name="server-title-short" content="${escapeHtml(identity.titleShort)}" />`,
    `<meta name="server-name" content="${escapeHtml(identity.name)}" />`,
  ].join('\n        ');
  // index.html indents with four spaces per level
  return html.replace(/( *)<\/head>/, `        ${tags}\n$1</head>`);
}
