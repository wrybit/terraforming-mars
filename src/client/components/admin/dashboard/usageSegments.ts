import {DashboardDisk, DashboardMachineUsage, ServerDashboard, UsageArea} from '@/common/admin/ServerDashboard';

/** Kinds of parts; each has its own color (admin_dashboard.less), the same in every bar. */
export type SegmentKind = UsageArea | 'gameData' | 'logs' | 'aiLogs' | 'cache' | 'free';

/** One part of a split bar: label (English, gets translated) and size in the unit of the bar. */
export type UsageSegment = {
  kind: SegmentKind,
  label: string,
  value: number,
};

// Areas of processor and memory in a fixed order: the game first, the system last before cache and free space
const AREAS: ReadonlyArray<{area: UsageArea, label: string}> = [
  {area: 'game', label: 'Game server'},
  {area: 'ai', label: 'AI'},
  {area: 'containers', label: 'Other containers'},
  {area: 'docker', label: 'Docker engine'},
  {area: 'reserve', label: 'Reserve (memory ballast)'},
  {area: 'programs', label: 'Other programs'},
];

/** Empty parts are left out; the free part stays, so a full bar still names it with 0. */
function withoutEmpty(segments: Array<UsageSegment>): Array<UsageSegment> {
  return segments.filter((segment) => segment.value > 0 || segment.kind === 'free');
}

/**
 * Parts of the disk, measured parts first and the free space last. What no measured part covers (operating
 * system, other programs, home folders) is "System and other", so the parts add up to the disk.
 */
export function diskSegments(disk: DashboardDisk): Array<UsageSegment> {
  const usage = disk.usage;
  const measured: Array<UsageSegment> = [
    {kind: 'docker', label: 'Docker and Node.js', value: usage?.docker ?? 0},
    {kind: 'game', label: 'Game (code and build)', value: usage?.game ?? 0},
    {kind: 'gameData', label: 'Saved games', value: usage?.gameData ?? 0},
    {kind: 'logs', label: 'Logs', value: usage?.logs ?? 0},
    {kind: 'aiLogs', label: 'AI decision logs', value: usage?.aiLogs ?? 0},
  ];
  const known = measured.reduce((sum, segment) => sum + segment.value, 0);
  return withoutEmpty([
    {kind: 'system', label: 'System and other', value: Math.max(0, disk.totalBytes - disk.freeBytes - known)},
    ...measured,
    {kind: 'free', label: 'Free', value: disk.freeBytes},
  ]);
}

function areaSegments(values: Partial<Record<UsageArea, number>>, rest: number): Array<UsageSegment> {
  const parts: Array<UsageSegment> = AREAS.map(({area, label}) => ({kind: area, label, value: values[area] ?? 0}));
  const known = parts.reduce((sum, segment) => sum + segment.value, 0);
  // The system takes what no area covers (kernel, services, rounding), never less than it measured itself
  return [...parts, {kind: 'system', label: 'System (kernel and services)', value: Math.max(values.system ?? 0, rest - known)}];
}

/**
 * Memory: the areas use part of it themselves; the file cache is given back on demand; the rest is free.
 * Without a measurement of the areas only the game server process is known.
 */
export function memorySegments(memory: ServerDashboard['memory'], usage: DashboardMachineUsage | undefined): Array<UsageSegment> {
  const used = memory.totalBytes - memory.availableBytes;
  const areas = usage?.memoryBytes ?? {game: memory.serverProcessBytes};
  return withoutEmpty([
    ...areaSegments(areas, used),
    {kind: 'cache', label: 'Cache (freed on demand)', value: Math.max(0, memory.availableBytes - memory.freeBytes)},
    {kind: 'free', label: 'Free', value: memory.freeBytes},
  ]);
}

/** Processor: share of the whole machine per area over the measured moments, the rest is idle. */
export function cpuSegments(usage: DashboardMachineUsage): Array<UsageSegment> {
  const busy = Object.values(usage.cpuPercent).reduce((sum, value) => sum + (value ?? 0), 0);
  const areas = areaSegments(usage.cpuPercent, busy);
  return withoutEmpty([...areas, {kind: 'free', label: 'Idle', value: Math.max(0, 100 - busy)}]);
}
