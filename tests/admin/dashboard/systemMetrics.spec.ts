import {expect} from 'chai';
import * as os from 'os';
import {memInfoBytes, systemMetrics} from '../../../src/server/admin/dashboard/systemMetrics';
import {checkReachability, publicStatusUrl} from '../../../src/server/admin/dashboard/reachability';

describe('systemMetrics', () => {
  it('reads values of /proc/meminfo in bytes', () => {
    const memInfo = 'MemTotal:       16000000 kB\nMemAvailable:    8000 kB\n';
    expect(memInfoBytes(memInfo, 'MemAvailable')).eq(8000 * 1024);
    expect(memInfoBytes(memInfo, 'SwapTotal')).is.undefined;
    expect(memInfoBytes(undefined, 'MemAvailable')).is.undefined;
  });

  it('measures the machine on any platform', async () => {
    const metrics = await systemMetrics(os.tmpdir());
    expect(metrics.cpu.cores).greaterThan(0);
    expect(metrics.cpu.usagePercent).within(0, 100);
    expect(metrics.memory.availableBytes).within(0, metrics.memory.totalBytes);
    expect(metrics.disk?.totalBytes).greaterThan(0);
  });
});

describe('reachability', () => {
  it('builds the status address from the host the admin used', () => {
    expect(publicStatusUrl('tm.example.org', true)).eq('https://tm.example.org/api/status');
    expect(publicStatusUrl('localhost:8080', false)).eq('http://localhost:8080/api/status');
  });

  it('reports status and errors', async () => {
    const ok = await checkReachability('https://x/api/status', () => Promise.resolve({ok: true, status: 200} as Response));
    expect(ok.ok).is.true;
    expect(ok.statusCode).eq(200);
    const failed = await checkReachability('https://x/api/status', () => Promise.reject(new TypeError('fetch failed', {cause: {code: 'ENOTFOUND'}})));
    expect(failed).deep.eq({url: 'https://x/api/status', ok: false, error: 'fetch failed (ENOTFOUND)'});
  });
});
