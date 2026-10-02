// Deleting should only work when the admin page is opened via the home network address (e.g. 192.168.…),
// not via the public DuckDNS address. Client (show button) and server (allow deletion) use
// the same rule so the two sides never diverge.

const privateIpv4Patterns = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
];

/** Hostname or Host header (with or without port) of an address on the local network or on this machine. */
export function isLocalNetworkHost(host: string | undefined): boolean {
  if (host === undefined) {
    return false;
  }
  // Remove port and IPv6 brackets: "192.168.178.77:17745" → "192.168.178.77", "[::1]:8080" → "::1"
  const hostname = host.trim().toLowerCase().replace(/^\[(.*)\](:\d+)?$/, '$1').replace(/^([^:]+):\d+$/, '$1');
  if (hostname === 'localhost' || hostname === '::1' || hostname.endsWith('.local')) {
    return true;
  }
  return privateIpv4Patterns.some((pattern) => pattern.test(hostname));
}
