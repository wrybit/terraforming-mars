import {DashboardReachability} from '../../../common/admin/ServerDashboard';
import {paths} from '../../../common/app/paths';

const TIMEOUT_MILLISECONDS = 5000;

/** Address under which the admin opened the dashboard: the one players use as well. */
export function publicStatusUrl(host: string, secure: boolean): string {
  return `${secure ? 'https' : 'http'}://${host}/${paths.API_STATUS}`;
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
