import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {ServerDashboard} from '../../../common/admin/ServerDashboard';

/*
 * Machine values for the admin dashboard. Linux exposes more (/proc, /sys) than os.* does; everything
 * Linux-only falls back quietly, so the dashboard also works on a developer's Mac or Windows machine.
 * Inside Docker /proc and /sys show the host, so the values describe the machine, not the container.
 */

function readText(file: string): string | undefined {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return undefined;
  }
}

/** Value in bytes of a /proc/meminfo line ("MemAvailable:  123 kB"). */
export function memInfoBytes(memInfo: string | undefined, key: string): number | undefined {
  const match = memInfo === undefined ? null : new RegExp(`^${key}:\\s+(\\d+) kB`, 'm').exec(memInfo);
  return match === null ? undefined : Number(match[1]) * 1024;
}

function cpuTimes(): {idle: number, total: number} {
  return os.cpus().reduce((sum, cpu) => {
    const times = cpu.times;
    return {idle: sum.idle + times.idle, total: sum.total + times.user + times.nice + times.sys + times.idle + times.irq};
  }, {idle: 0, total: 0});
}

/** Busy share of all cores over `sampleMilliseconds` (load average alone lags by minutes). */
async function cpuUsagePercent(sampleMilliseconds = 250): Promise<number> {
  const before = cpuTimes();
  await new Promise((resolve) => setTimeout(resolve, sampleMilliseconds));
  const after = cpuTimes();
  const total = after.total - before.total;
  return total <= 0 ? 0 : Math.round((1 - (after.idle - before.idle) / total) * 1000) / 10;
}

/** Hottest thermal zone in °C; undefined on machines without sensors (most VMs). */
function temperatureCelsius(): number | undefined {
  const base = '/sys/class/thermal';
  let zones: Array<string>;
  try {
    zones = fs.readdirSync(base).filter((name) => name.startsWith('thermal_zone'));
  } catch {
    return undefined;
  }
  const values = zones
    .map((zone) => Number(readText(path.join(base, zone, 'temp'))))
    .filter((value) => Number.isFinite(value) && value > 0);
  return values.length === 0 ? undefined : Math.round(Math.max(...values) / 100) / 10;
}

const GPU_VENDORS: Record<string, string> = {
  '0x8086': 'Intel',
  '0x10de': 'NVIDIA',
  '0x1002': 'AMD',
  '0x1af4': 'Virtio (virtual)',
  '0x1234': 'QEMU (virtual)',
  '0x15ad': 'VMware (virtual)',
};

/** Graphics adapters from /sys/class/drm (card0, card1 …); vendor name and PCI device id. */
function gpus(): Array<string> {
  const base = '/sys/class/drm';
  let cards: Array<string>;
  try {
    cards = fs.readdirSync(base).filter((name) => /^card\d+$/.test(name));
  } catch {
    return [];
  }
  return cards.map((card) => {
    const vendor = readText(path.join(base, card, 'device', 'vendor'))?.trim() ?? '';
    const device = readText(path.join(base, card, 'device', 'device'))?.trim() ?? '';
    return `${GPU_VENDORS[vendor] ?? (vendor || 'Unknown')} ${device}`.trim();
  });
}

/** Free and total bytes of the disk holding `folder`; undefined where statfs is missing. */
function disk(folder: string): ServerDashboard['disk'] {
  try {
    const stats = fs.statfsSync(folder);
    return {totalBytes: stats.blocks * stats.bsize, freeBytes: stats.bavail * stats.bsize};
  } catch {
    return undefined;
  }
}

/**
 * Pretty name of the operating system ("Ubuntu 24.04.1 LTS"), else kernel name and version. Inside Docker
 * /etc/os-release names the image (Alpine), not the machine: then the kernel of the machine comes first.
 */
function operatingSystem(): string {
  const release = readText('/etc/os-release');
  const pretty = release === undefined ? null : /^PRETTY_NAME="?([^"\n]+)"?/m.exec(release);
  if (pretty === null) {
    return `${os.type()} ${os.release()}`;
  }
  return fs.existsSync('/.dockerenv') ? `${os.type()} ${os.release()} (Docker: ${pretty[1]})` : `${pretty[1]} (kernel ${os.release()})`;
}

/** Size of a file or of all files below a folder; undefined if it does not exist. */
export function sizeOnDisk(target: string): number | undefined {
  try {
    const stats = fs.statSync(target);
    if (!stats.isDirectory()) {
      return stats.size;
    }
    return fs.readdirSync(target).reduce((sum, name) => sum + (sizeOnDisk(path.join(target, name)) ?? 0), 0);
  } catch {
    return undefined;
  }
}

export async function systemMetrics(dataFolder: string): Promise<Pick<ServerDashboard, 'host' | 'cpu' | 'memory' | 'disk' | 'gpus'>> {
  const memInfo = readText('/proc/meminfo');
  const [load1, load5, load15] = os.loadavg();
  const processors = os.cpus();
  return {
    host: {
      hostname: os.hostname(),
      operatingSystem: operatingSystem(),
      architecture: os.arch(),
      nodeVersion: process.version,
      systemUptimeSeconds: Math.round(os.uptime()),
      serverUptimeSeconds: Math.round(process.uptime()),
    },
    cpu: {
      model: processors[0]?.model.trim() || os.arch(),
      cores: processors.length,
      loadAverage: [load1, load5, load15],
      usagePercent: await cpuUsagePercent(),
      temperatureCelsius: temperatureCelsius(),
    },
    memory: {
      totalBytes: os.totalmem(),
      // MemAvailable counts reclaimable cache as free; os.freemem() would make a healthy Linux look full
      availableBytes: memInfoBytes(memInfo, 'MemAvailable') ?? os.freemem(),
      freeBytes: memInfoBytes(memInfo, 'MemFree') ?? os.freemem(),
      swapTotalBytes: memInfoBytes(memInfo, 'SwapTotal') ?? 0,
      swapFreeBytes: memInfoBytes(memInfo, 'SwapFree') ?? 0,
      serverProcessBytes: process.memoryUsage().rss,
    },
    disk: disk(dataFolder),
    gpus: gpus(),
  };
}
