import {isIP} from 'net';
import {asArray} from '../../common/utils/utils';
import {Request} from '../Request';

// Connections from these addresses come from a reverse proxy on the same machine (Caddy, Nginx Proxy Manager,
// Docker's port forwarding) or inside a hosting platform: only their X-Forwarded-For is believed.
// Home networks (192.168.x.x) are deliberately not on the list, so a client there cannot claim any address.
const TRUSTED_PROXY_PATTERNS: ReadonlyArray<RegExp> = [
  /^127\./,
  /^::1$/,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
];

/** IPv4 addresses arrive as "::ffff:1.2.3.4" on dual-stack sockets. */
function withoutIpv6Prefix(address: string): string {
  return address.startsWith('::ffff:') ? address.slice('::ffff:'.length) : address;
}

function isTrustedProxy(address: string): boolean {
  return TRUSTED_PROXY_PATTERNS.some((pattern) => pattern.test(address));
}

/**
 * The address of the client, used for quotas, login throttling and the admin's address list.
 *
 * X-Forwarded-For counts only when the connection comes from a trusted proxy, and then its LAST entry:
 * that is the one the proxy added itself; everything before it was sent by the client and can be invented.
 */
export function clientAddress(req: Request): string {
  const remote = withoutIpv6Prefix(req.socket.remoteAddress ?? '');
  if (isTrustedProxy(remote)) {
    const forwarded = asArray(req.headers['x-forwarded-for']).join(',').split(',')
      .map((entry) => withoutIpv6Prefix(entry.trim()))
      .filter((entry) => isIP(entry) !== 0);
    const last = forwarded[forwarded.length - 1];
    if (last !== undefined) {
      return last;
    }
  }
  return remote;
}
