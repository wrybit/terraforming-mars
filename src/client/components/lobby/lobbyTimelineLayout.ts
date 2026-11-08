// Horizontal layout of the lobby course bar (LobbyGameTimeline.vue): one segment per generation plus the estimated
// rest. A segment is as wide as its share of the time, but never narrower than its minimum, so a short generation
// always keeps its number and its dots. Whatever the minimums take is taken from the long segments: a long
// generation simply stops growing. Columns, the bar below and the labels all use these same pixels, so they stay
// in line.

export type TimelineSegment = {left: number, width: number};

/** Gap between two segments in px */
export const TIMELINE_GAP = 3;

/**
 * @param weights length of every segment (ms), in order
 * @param minimums minimum width of every segment (px)
 * @param trackWidth width of the whole track (px)
 * @param fallbackMinimums smaller minimums for when the first ones do not fit together (e.g. without room for the
 *   number, only for the dots); default: the minimums
 */
export function layoutTimeline(weights: ReadonlyArray<number>, minimums: ReadonlyArray<number>, trackWidth: number,
  fallbackMinimums: ReadonlyArray<number> = minimums): Array<TimelineSegment> {
  const count = weights.length;
  if (count === 0) {
    return [];
  }
  const available = Math.max(0, trackWidth - TIMELINE_GAP * (count - 1));
  const sum = (values: ReadonlyArray<number>) => values.reduce((total, value) => total + value, 0);
  const widths = distribute(weights.map((weight) => Math.max(0, weight)), sum(minimums) <= available ? minimums : fallbackMinimums, available);
  let left = 0;
  return widths.map((width) => {
    const segment = {left, width};
    left += width + TIMELINE_GAP;
    return segment;
  });
}

function distribute(weights: ReadonlyArray<number>, minimums: ReadonlyArray<number>, available: number): Array<number> {
  const minimumSum = minimums.reduce((sum, minimum) => sum + minimum, 0);
  // Not even the minimums fit (very many generations on a phone): all shrink by the same factor
  if (minimumSum >= available) {
    return minimums.map((minimum) => minimumSum > 0 ? minimum / minimumSum * available : available / minimums.length);
  }
  // Water filling: segments whose share would be below their minimum get the minimum, the others share the rest
  // proportionally. Repeat until no free segment falls below its minimum any more.
  const pinned = new Set<number>();
  for (;;) {
    const free = weights.map((_, index) => index).filter((index) => !pinned.has(index));
    const pinnedWidth = [...pinned].reduce((sum, index) => sum + minimums[index], 0);
    const freeWeight = free.reduce((sum, index) => sum + weights[index], 0);
    const room = available - pinnedWidth;
    const shareOf = (index: number) => freeWeight > 0 ? weights[index] / freeWeight * room : room / free.length;
    const tooNarrow = free.filter((index) => shareOf(index) < minimums[index]);
    if (tooNarrow.length === 0) {
      return weights.map((_, index) => pinned.has(index) ? minimums[index] : shareOf(index));
    }
    tooNarrow.forEach((index) => pinned.add(index));
  }
}
