// Löschen soll nur gehen, wenn die Admin-Seite über die Heimnetz-Adresse aufgerufen wird (z. B. 192.168.…),
// nicht über die öffentliche DuckDNS-Adresse. Client (Button zeigen) und Server (Löschen erlauben) nutzen
// dieselbe Regel, damit beide Seiten nie auseinanderlaufen.

const privateIpv4Patterns = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
];

/** Hostname oder Host-Header (mit oder ohne Port) einer Adresse im lokalen Netz bzw. auf diesem Rechner. */
export function isLocalNetworkHost(host: string | undefined): boolean {
  if (host === undefined) {
    return false;
  }
  // Port und IPv6-Klammern entfernen: "192.168.178.77:17745" → "192.168.178.77", "[::1]:8080" → "::1"
  const hostname = host.trim().toLowerCase().replace(/^\[(.*)\](:\d+)?$/, '$1').replace(/^([^:]+):\d+$/, '$1');
  if (hostname === 'localhost' || hostname === '::1' || hostname.endsWith('.local')) {
    return true;
  }
  return privateIpv4Patterns.some((pattern) => pattern.test(hostname));
}
