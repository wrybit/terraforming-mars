import {DashboardDisk} from '@/common/admin/ServerDashboard';

/** One part of the disk bar: label (English, gets translated), bytes and the color class suffix. */
export type DiskSegment = {
  key: 'system' | 'docker' | 'game' | 'gameData' | 'logs' | 'aiLogs' | 'free',
  label: string,
  bytes: number,
};

/**
 * Parts of the disk in a fixed order, measured parts first and the free space last. What no measured part
 * covers (operating system, other programs, home folders) is "System and other", so the parts add up to the disk.
 */
export function diskSegments(disk: DashboardDisk): Array<DiskSegment> {
  const usage = disk.usage;
  const measured: Array<DiskSegment> = [
    {key: 'docker', label: 'Docker and Node.js', bytes: usage?.docker ?? 0},
    {key: 'game', label: 'Game (code and build)', bytes: usage?.game ?? 0},
    {key: 'gameData', label: 'Saved games', bytes: usage?.gameData ?? 0},
    {key: 'logs', label: 'Logs', bytes: usage?.logs ?? 0},
    {key: 'aiLogs', label: 'AI decision logs', bytes: usage?.aiLogs ?? 0},
  ];
  const used = disk.totalBytes - disk.freeBytes;
  const known = measured.reduce((sum, segment) => sum + segment.bytes, 0);
  const segments: Array<DiskSegment> = [
    {key: 'system', label: 'System and other', bytes: Math.max(0, used - known)},
    ...measured,
    {key: 'free', label: 'Free', bytes: disk.freeBytes},
  ];
  return segments.filter((segment) => segment.bytes > 0 || segment.key === 'free');
}
