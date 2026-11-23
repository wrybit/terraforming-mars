import * as os from 'os';
import * as path from 'path';
import {LiveLoadSample} from '../../../common/admin/LiveLoad';
import {readTextFile} from './readTextFile';
import {memInfoBytes} from './systemMetrics';

// Linux counts processor time of a process in ticks of 1/100 s (USER_HZ, 100 on every common kernel)
const TICKS_PER_SECOND = 100;
// Without a measurement this recent the first one waits a moment, so the very first answer has real values
const FIRST_SAMPLE_MILLISECONDS = 250;
const STALE_MILLISECONDS = 10_000;

type CoreTimes = {idle: number, total: number};

type Snapshot = {
  atMs: number,
  cores: Array<CoreTimes>,
  /** Microseconds of processor time of the game server process */
  serverMicroseconds: number,
  /** Ticks of processor time per bot process */
  botTicks: Map<number, number>,
};

function coreTimes(): Array<CoreTimes> {
  return os.cpus().map(({times}) => ({idle: times.idle, total: times.user + times.nice + times.sys + times.idle + times.irq}));
}

/** utime + stime of a process from /proc/<pid>/stat; undefined off Linux or when it ended. */
export function processTicks(stat: string | undefined): number | undefined {
  if (stat === undefined) {
    return undefined;
  }
  // The name in brackets may hold spaces: the fields count from the closing bracket
  const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
  const user = Number(fields[11]);
  const system = Number(fields[12]);
  return Number.isFinite(user) && Number.isFinite(system) ? user + system : undefined;
}

function processBytes(processId: number): number | undefined {
  return memInfoBytes(readTextFile(path.join('/proc', String(processId), 'status')), 'VmRSS');
}

function round(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)) * 10) / 10;
}

/**
 * Measures the machine against the previous call: processor shares are always "since last time", so the admin
 * page polling every second gets one-second values without the server sampling in the background.
 */
export class LiveLoad {
  private previous: Snapshot | undefined = undefined;

  constructor(private readonly botProcessIds: ReadonlySet<number>, private readonly now: () => number = Date.now) {}

  private snapshot(): Snapshot {
    const usage = process.cpuUsage();
    const botTicks = new Map<number, number>();
    for (const processId of this.botProcessIds) {
      const ticks = processTicks(readTextFile(path.join('/proc', String(processId), 'stat')));
      if (ticks !== undefined) {
        botTicks.set(processId, ticks);
      }
    }
    return {atMs: this.now(), cores: coreTimes(), serverMicroseconds: usage.user + usage.system, botTicks};
  }

  public async sample(): Promise<LiveLoadSample> {
    let before = this.previous;
    if (before === undefined || this.now() - before.atMs > STALE_MILLISECONDS) {
      before = this.snapshot();
      await new Promise((resolve) => setTimeout(resolve, FIRST_SAMPLE_MILLISECONDS));
    }
    const after = this.snapshot();
    this.previous = after;

    const cores = after.cores.length;
    const elapsedSeconds = Math.max(0.001, (after.atMs - before.atMs) / 1000);
    const corePercent = after.cores.map((core, index) => {
      const earlier = before.cores[index] ?? core;
      const total = core.total - earlier.total;
      return total <= 0 ? 0 : round((1 - (core.idle - earlier.idle) / total) * 100);
    });
    const totalPercent = round(corePercent.reduce((sum, value) => sum + value, 0) / Math.max(1, cores));
    // Shares of the whole machine: a process using one core fully on four cores takes 25 %
    const capacitySeconds = elapsedSeconds * Math.max(1, cores);
    const gameServerPercent = round((after.serverMicroseconds - before.serverMicroseconds) / 1e6 / capacitySeconds * 100);
    let aiPercent: number | undefined = undefined;
    let aiBytes: number | undefined = undefined;
    if (process.platform === 'linux') {
      let ticks = 0;
      for (const [processId, now] of after.botTicks) {
        // A bot started since the previous measurement counts from zero
        ticks += now - (before.botTicks.get(processId) ?? now);
      }
      aiPercent = round(ticks / TICKS_PER_SECOND / capacitySeconds * 100);
      aiBytes = [...after.botTicks.keys()].reduce((sum, processId) => sum + (processBytes(processId) ?? 0), 0);
    }
    const memInfo = readTextFile('/proc/meminfo');
    return {
      measuredAtMs: after.atMs,
      cores,
      processorModel: os.cpus()[0]?.model.trim() || os.arch(),
      corePercent,
      cpu: {totalPercent, gameServerPercent, aiPercent},
      memory: {
        totalBytes: os.totalmem(),
        availableBytes: memInfoBytes(memInfo, 'MemAvailable') ?? os.freemem(),
        gameServerBytes: process.memoryUsage().rss,
        aiBytes,
      },
      aiBots: this.botProcessIds.size,
    };
  }
}
