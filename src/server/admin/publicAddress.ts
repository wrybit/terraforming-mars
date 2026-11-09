import {lookup} from 'dns/promises';
import {isIP} from 'net';

// Requests to an address that comes from outside (e.g. the link of a game to import) must not reach this machine
// or the network it stands in: a link to localhost or 192.168.… would otherwise make the server call its own
// internal services (server-side request forgery).

// IPv4 ranges that are not on the public internet: "this" network, private networks, carrier-grade NAT,
// loopback, link-local, IETF protocol assignments, benchmarking, multicast and reserved
const NON_PUBLIC_IPV4: ReadonlyArray<readonly [string, number]> = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['224.0.0.0', 3],
];

function ipv4ToNumber(address: string): number {
  return address.split('.').reduce((value, part) => value * 256 + Number(part), 0);
}

function isInIpv4Range(address: string, [base, prefixLength]: readonly [string, number]): boolean {
  const size = 2 ** (32 - prefixLength);
  return Math.floor(ipv4ToNumber(address) / size) === Math.floor(ipv4ToNumber(base) / size);
}

/** True only for addresses on the public internet (not loopback, private, link-local, multicast …). */
export function isPublicIpAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    return !NON_PUBLIC_IPV4.some((range) => isInIpv4Range(address, range));
  }
  if (version === 6) {
    const lower = address.toLowerCase();
    // IPv4-mapped (::ffff:10.0.0.1) counts as the IPv4 address it carries
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped !== null) {
      return isPublicIpAddress(mapped[1]);
    }
    if (lower === '::' || lower === '::1') {
      return false;
    }
    // fc00::/7 unique local, fe80::/10 link-local, ff00::/8 multicast
    return !/^(f[cd]|fe[89ab]|ff)/.test(lower);
  }
  return false;
}

export type AddressResolver = (hostname: string) => Promise<ReadonlyArray<string>>;

async function resolveAll(hostname: string): Promise<ReadonlyArray<string>> {
  return (await lookup(hostname, {all: true})).map((entry) => entry.address);
}

/** Throws unless every address the host of the URL resolves to is public. */
export async function assertPublicUrl(url: string, resolve: AddressResolver = resolveAll): Promise<void> {
  const hostname = new URL(url).hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(hostname) === 0 ? await resolve(hostname) : [hostname];
  if (addresses.length === 0 || !addresses.every(isPublicIpAddress)) {
    throw new Error('Only servers on the public internet can be imported');
  }
}
