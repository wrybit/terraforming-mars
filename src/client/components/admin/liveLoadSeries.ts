import {LiveLoadSample} from '@/common/admin/LiveLoad';
import {UsageSegment} from '@/client/components/admin/dashboard/usageSegments';

/** Seconds the live graph shows; older samples drop out on the left. */
export const LIVE_LOAD_WINDOW = 60;

/** Parts of the processor, bottom to top; the kinds carry the colors of the dashboard bars (admin_dashboard.less). */
export type LoadLayerKind = 'ai' | 'game' | 'system';
export const LOAD_LAYERS: ReadonlyArray<{kind: LoadLayerKind, label: string}> = [
  {kind: 'ai', label: 'AI'},
  {kind: 'game', label: 'Game server'},
  {kind: 'system', label: 'Other programs'},
];

/** Share of each part in one sample; the AI first, since its threads are what the settings next to it change. */
export function loadParts(sample: LiveLoadSample): Record<LoadLayerKind, number> {
  const ai = sample.cpu.aiPercent ?? 0;
  const game = sample.cpu.gameServerPercent;
  // Measured at slightly different moments: the parts never add up to more than the total
  const system = Math.max(0, sample.cpu.totalPercent - ai - game);
  return {ai, game, system};
}

/**
 * Stacked areas as SVG paths in a box of width × height (0–100 % from the bottom): one path per part, the newest
 * sample at the right edge, so a short history grows in from the right like a scrolling chart.
 */
export function stackedAreaPaths(samples: ReadonlyArray<LiveLoadSample>, width: number, height: number): Record<LoadLayerKind, string> {
  const step = width / (LIVE_LOAD_WINDOW - 1);
  const offset = width - (samples.length - 1) * step;
  const x = (index: number) => Math.round((offset + index * step) * 10) / 10;
  const y = (value: number) => Math.round((height - Math.min(100, value) / 100 * height) * 10) / 10;
  const paths = {ai: '', game: '', system: ''} as Record<LoadLayerKind, string>;
  if (samples.length === 0) {
    return paths;
  }
  const parts = samples.map(loadParts);
  let below = samples.map(() => 0);
  for (const {kind} of LOAD_LAYERS) {
    const above = below.map((base, index) => base + parts[index][kind]);
    // Only one sample: a thin column at the right edge instead of nothing
    const top = above.map((value, index) => `${x(index)},${y(value)}`);
    const bottom = below.map((value, index) => `${x(index)},${y(value)}`).reverse();
    if (samples.length === 1) {
      top.unshift(`${width - step},${y(above[0])}`);
      bottom.push(`${width - step},${y(below[0])}`);
    }
    paths[kind] = `M${top.join('L')}L${bottom.join('L')}Z`;
    below = above;
  }
  return paths;
}

/** Index of the sample under a horizontal position of the graph (0–1 of its width); undefined left of the history. */
export function sampleAt(fraction: number, count: number): number | undefined {
  const fromRight = Math.round((1 - fraction) * (LIVE_LOAD_WINDOW - 1));
  const index = count - 1 - fromRight;
  return index >= 0 && index < count ? index : undefined;
}

/** Memory of the machine split like the dashboard bar: AI bots, game server, the rest in use, free. */
export function liveMemorySegments(sample: LiveLoadSample): Array<UsageSegment> {
  const used = Math.max(0, sample.memory.totalBytes - sample.memory.availableBytes);
  const ai = sample.memory.aiBytes ?? 0;
  const game = sample.memory.gameServerBytes;
  return [
    {kind: 'ai', label: 'AI', value: ai},
    {kind: 'game', label: 'Game server', value: game},
    {kind: 'system', label: 'Other programs', value: Math.max(0, used - ai - game)},
    {kind: 'free', label: 'Free', value: sample.memory.availableBytes},
  ].filter((segment): segment is UsageSegment => segment.value > 0 || segment.kind === 'free');
}
