import * as fs from 'fs';
import * as path from 'path';
import {DashboardGpu} from '../../../common/admin/ServerDashboard';
import {readTextFile} from './readTextFile';

/*
 * Graphics adapters for the admin dashboard, from /sys/class/drm (inside Docker it shows the machine). Everything
 * here is readable without root: load and clock of Intel and AMD chips, own memory of AMD cards. The container
 * has no PCI name database, so known chips get their name from the list below.
 */

// Overridable so a copy of another machine's folder can be shown on a developer machine
const DRM_FOLDER = process.env.DRM_FOLDER ?? '/sys/class/drm';

const VENDORS: Record<string, string> = {
  '0x8086': 'Intel',
  '0x10de': 'NVIDIA',
  '0x1002': 'AMD',
  '0x1af4': 'Virtio',
  '0x1234': 'QEMU',
  '0x15ad': 'VMware',
};
const VIRTUAL_VENDORS = new Set(['0x1af4', '0x1234', '0x15ad']);

// Chips of the servers in use; others show vendor and device id
const DEVICE_NAMES: Record<string, string> = {
  '0x8086:0x4e61': 'Intel UHD Graphics (Jasper Lake)',
  '0x1af4:0x1050': 'Virtio GPU',
};

function readNumber(file: string): number | undefined {
  const text = readTextFile(file);
  const value = text === undefined ? NaN : Number(text.trim());
  return Number.isFinite(value) ? value : undefined;
}

// Intel: newer kernels per GT (gt/gt0), older ones per card
function firstNumber(cardFolder: string, ...files: Array<string>): number | undefined {
  for (const file of files) {
    const value = readNumber(path.join(cardFolder, file));
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
}

type Card = {folder: string, vendor: string, device: string};

function cards(): Array<Card> {
  let names: Array<string>;
  try {
    names = fs.readdirSync(DRM_FOLDER).filter((name) => /^card\d+$/.test(name));
  } catch {
    return [];
  }
  return names.map((name) => {
    const folder = path.join(DRM_FOLDER, name);
    return {
      folder,
      vendor: readTextFile(path.join(folder, 'device', 'vendor'))?.trim() ?? '',
      device: readTextFile(path.join(folder, 'device', 'device'))?.trim() ?? '',
    };
  });
}

// The driver folder is a link named after the kernel driver (…/drivers/i915)
function driverName(deviceFolder: string): string | undefined {
  try {
    return path.basename(fs.readlinkSync(path.join(deviceFolder, 'driver')));
  } catch {
    return undefined;
  }
}

// Intel reports the time the chip spent idle (RC6, in ms): busy is the rest of the sample
function intelIdleMilliseconds(card: Card): number | undefined {
  return firstNumber(card.folder, 'gt/gt0/rc6_residency_ms', 'power/rc6_residency_ms');
}

function describe(card: Card, busyPercent: number | undefined): DashboardGpu {
  const device = card.folder + '/device';
  const vramTotal = readNumber(path.join(device, 'mem_info_vram_total'));
  const vramUsed = readNumber(path.join(device, 'mem_info_vram_used'));
  const currentMhz = firstNumber(card.folder, 'gt_act_freq_mhz', 'gt/gt0/rps_act_freq_mhz');
  const maxMhz = firstNumber(card.folder, 'gt_RP0_freq_mhz', 'gt/gt0/rps_RP0_freq_mhz');
  let kind: DashboardGpu['kind'] = vramTotal !== undefined || card.vendor === '0x10de' ? 'dedicated' : 'integrated';
  if (VIRTUAL_VENDORS.has(card.vendor)) {
    kind = 'virtual';
  }
  return {
    name: DEVICE_NAMES[`${card.vendor}:${card.device}`] ?? `${VENDORS[card.vendor] ?? (card.vendor || 'Unknown')} ${card.device}`.trim(),
    driver: driverName(device),
    kind,
    // AMD tells the busy share directly
    busyPercent: busyPercent ?? readNumber(path.join(device, 'gpu_busy_percent')),
    clockMhz: currentMhz !== undefined && maxMhz !== undefined ? {current: currentMhz, max: maxMhz} : undefined,
    videoMemory: vramTotal !== undefined && vramUsed !== undefined ? {totalBytes: vramTotal, usedBytes: vramUsed} : undefined,
  };
}

/** All graphics adapters with load measured over `sampleMilliseconds` (in parallel with the processor sample). */
export async function graphicsAdapters(sampleMilliseconds = 250): Promise<Array<DashboardGpu>> {
  const found = cards();
  const idleBefore = found.map(intelIdleMilliseconds);
  const startedMs = Date.now();
  if (idleBefore.some((value) => value !== undefined)) {
    await new Promise((resolve) => setTimeout(resolve, sampleMilliseconds));
  }
  const elapsedMs = Math.max(1, Date.now() - startedMs);
  return found.map((card, index) => {
    const before = idleBefore[index];
    const after = intelIdleMilliseconds(card);
    const busyPercent = before === undefined || after === undefined ?
      undefined :
      Math.round(Math.min(100, Math.max(0, 100 - (after - before) * 100 / elapsedMs)));
    return describe(card, busyPercent);
  });
}
