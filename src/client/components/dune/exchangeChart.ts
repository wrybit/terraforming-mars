import {Resource} from '@/common/Resource';
import {ExchangeBoardModel, MAX_DEVIATION} from '@/common/dune/smugglingExchange';

// Geometry of the exchange history above the resource tiles of the smuggling trade (ExchangeChart.vue, Jens 20 Oct
// 2026): one column per tile, the current generation at the bottom, older ones above. Horizontal positions in percent
// of a column, so the columns can be as wide as the tiles below them (narrower on the phone); vertical ones in pixels.

/** Height of the chart and the room above the oldest and below the newest point */
export const CHART_HEIGHT = 92;
const EDGE = 9;
/** Room left and right in a column, in percent */
const SIDE = 16;
/** At most this many generations are shown; older ones would only crowd the chart */
export const SHOWN_GENERATIONS = 5;

export type Mood = 'good' | 'bad' | 'normal';

export type ChartPoint = {x: number, y: number, mood: Mood, current: boolean};
export type ChartArea = {points: string, mood: Mood};
export type ChartColumn = {resource: Resource, normalX: number, line: string, points: ReadonlyArray<ChartPoint>, areas: ReadonlyArray<ChartArea>};
export type ChartRow = {generation: number, top: number};
export type ExchangeChart = {columns: ReadonlyArray<ChartColumn>, rows: ReadonlyArray<ChartRow>};

/** Above normal is good when you give (more Solari for it), below normal when you get (cheaper) */
export function moodOf(rate: number, normal: number, higherIsGood: boolean): Mood {
  if (rate === normal) {
    return 'normal';
  }
  return (rate > normal) === higherIsGood ? 'good' : 'bad';
}

const round = (value: number) => Math.round(value * 10) / 10;

export function exchangeChart(resources: ReadonlyArray<Resource>, board: ExchangeBoardModel, higherIsGood: boolean, generation: number): ExchangeChart {
  const history = board.history.slice(-SHOWN_GENERATIONS);
  const count = history.length;
  const y = (index: number) => count === 1 ? CHART_HEIGHT - EDGE : round(EDGE + index * (CHART_HEIGHT - 2 * EDGE) / (count - 1));
  const columns = resources.map((resource) => {
    const normal = board.normal[resource];
    // The column spans normal ±2: the dashed normal line sits in its middle
    const x = (rate: number) => round(SIDE + (rate - normal + MAX_DEVIATION) / (2 * MAX_DEVIATION) * (100 - 2 * SIDE));
    const normalX = x(normal);
    const points = history.map((rates, index) => ({
      x: x(rates[resource]), y: y(index), mood: moodOf(rates[resource], normal, higherIsGood), current: index === count - 1,
    }));
    // Area between the normal line and the rate, split where the rate crosses it
    const areas: Array<ChartArea> = [];
    for (let index = 0; index + 1 < count; index++) {
      const a = history[index][resource] - normal;
      const b = history[index + 1][resource] - normal;
      const pa = points[index];
      const pb = points[index + 1];
      if (a * b < 0) {
        const crossY = round(pa.y + a / (a - b) * (pb.y - pa.y));
        areas.push({points: `${normalX},${pa.y} ${pa.x},${pa.y} ${normalX},${crossY}`, mood: pa.mood});
        areas.push({points: `${normalX},${crossY} ${pb.x},${pb.y} ${normalX},${pb.y}`, mood: pb.mood});
      } else if (a !== 0 || b !== 0) {
        areas.push({points: `${normalX},${pa.y} ${pa.x},${pa.y} ${pb.x},${pb.y} ${normalX},${pb.y}`, mood: a !== 0 ? pa.mood : pb.mood});
      }
    }
    return {resource, normalX, line: points.map((point) => `${point.x},${point.y}`).join(' '), points, areas};
  });
  const rows = history.map((_, index) => ({generation: generation - (count - 1 - index), top: y(index)}));
  return {columns, rows};
}

/** Change of a rate to the generation before: its size and whether that is good for the player */
export function rateChange(board: ExchangeBoardModel, resource: Resource, higherIsGood: boolean): {delta: number, mood: Mood} {
  const history = board.history;
  const now = history[history.length - 1][resource];
  const before = history.length > 1 ? history[history.length - 2][resource] : now;
  return {delta: now - before, mood: moodOf(now, before, higherIsGood)};
}
