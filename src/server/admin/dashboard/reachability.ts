import {DashboardReachability} from '../../../common/admin/ServerDashboard';
import {paths} from '../../../common/app/paths';

const TIMEOUT_MILLISECONDS = 5000;

// A host name or IP address with an optional port – nothing that could add user info, a path or another scheme
const HOST_HEADER = /^([a-z0-9-]+(\.[a-z0-9-]+)*|\[[0-9a-f:.]+\])(:\d{1,5})?$/i;

/**
 * Address under which the admin opened the dashboard: the one players use as well.
 * The host comes from the request header, so anything but a plain host (and port) falls back to localhost:
 * the check only ever asks this server's status path, never an address an attacker composed.
 */
export function publicStatusUrl(host: string, secure: boolean): string {
  const safeHost = HOST_HEADER.test(host) ? host : 'localhost';
  return `${secure ? 'https' : 'http'}://${safeHost}/${paths.API_STATUS}`;
}

/**
 * Fetches the status of this server through its public address. That goes the whole way a player's browser
 * goes (name resolution, proxy, certificate), so a broken proxy or certificate shows up here.
 */
export async function checkReachability(url: string, fetcher: typeof fetch = fetch): Promise<DashboardReachability> {
  const startMs = Date.now();
  try {
    const response = await fetcher(url, {signal: AbortSignal.timeout(TIMEOUT_MILLISECONDS), cache: 'no-store'});
    return {url, ok: response.ok, statusCode: response.status, latencyMs: Date.now() - startMs};
  } catch (error) {
    const cause = (error as {cause?: {code?: string}}).cause?.code;
    const message = error instanceof Error ? error.message : String(error);
    return {url, ok: false, error: cause === undefined ? message : `${message} (${cause})`};
  }
}
