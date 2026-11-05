// Links in chat messages: only links to this server are allowed, everything else is refused (no spam, no phishing).
// Recognised are addresses with a scheme (https://…), with www. and bare domains with a common top-level domain;
// a plain "Hallo.Wie" or "z.B." is no link.

const COMMON_TOP_LEVEL_DOMAINS = [
  'com', 'net', 'org', 'info', 'biz', 'io', 'gg', 'me', 'co', 'tv', 'ly', 'to', 'cc', 'app', 'dev', 'xyz', 'link', 'site', 'online',
  'shop', 'club', 'top', 'de', 'at', 'ch', 'eu', 'uk', 'fr', 'nl', 'be', 'it', 'es', 'pl', 'ru', 'us', 'ua', 'cn', 'jp', 'kr', 'br',
];

const LINK = new RegExp(
  '(?:https?:\\/\\/|www\\.)[^\\s]+' +
  '|\\b(?:[a-z0-9-]+\\.)+(?:' + COMMON_TOP_LEVEL_DOMAINS.join('|') + ')(?::\\d+)?(?:\\/[^\\s]*)?(?![a-z0-9-])',
  'gi');

/** Host (with port) of a link as written, lower case; undefined if it cannot be read */
function hostOf(link: string): string | undefined {
  try {
    return new URL(/^https?:\/\//i.test(link) ? link : 'http://' + link).host.toLowerCase();
  } catch {
    return undefined;
  }
}

/** Every link in the text */
export function linksIn(text: string): Array<string> {
  return text.match(LINK) ?? [];
}

/** Whether the text links somewhere else than this server (serverHost: the Host header, e.g. localhost:8123) */
export function hasForeignLink(text: string, serverHost: string | undefined): boolean {
  const own = serverHost?.toLowerCase();
  return linksIn(text).some((link) => own === undefined || hostOf(link) !== own);
}
