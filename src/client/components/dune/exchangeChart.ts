import {Resource} from '@/common/Resource';
import {ExchangeBoardModel, FAVOUR_MAX, FAVOUR_MIN, PEAK_FAVOUR} from '@/common/dune/smugglingExchange';

// Geometry of the exchange history above the resource tiles of the guild trade (ExchangeChart.vue, Jens 20 and 24 Oct
// 2026): one column per tile, older generations above, the current one outlined, and below it – after a gap – the
// forecast of the next generation (dashed line, open ring). Horizontal positions in percent of a column, so the columns
// can be as wide as the tiles below them (narrower on the phone); vertical ones in pixels. A column spans the favour
// range −2 … +4: more room on the side in the player's favour.

/** Height of the chart, the room above the oldest and below the forecast point, and the gap before the forecast */
export const CHART_HEIGHT = 128;
const EDGE = 9;
const FORECAST_GAP = 34;
/** Room left and right in a column, in percent */
const SIDE = 16;
/** At most this many generations are shown; older ones would only crowd the chart */
export const SHOWN_GENERATIONS = 4;

export type Mood = 'good' | 'bad' | 'normal';

export type ChartPoint = {x: number, y: number, mood: Mood, current: boolean};
export type ChartArea = {points: string, mood: Mood};
export type ChartColumn = {
  resource: Resource,
  normalX: number,
  line: string,
  points: ReadonlyArray<ChartPoint>,
  areas: ReadonlyArray<ChartArea>,
  /** The forecast point and the dashed line to it; missing in games from before the forecast */
  forecast: {point: ChartPoint, line: string} | undefined,
};
export type ChartRow = {generation: number, top: number, kind: 'past' | 'now' | 'next'};
export type ExchangeChart = {columns: ReadonlyArray<ChartColumn>, rows: ReadonlyArray<ChartRow>, bandTop: number};

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
  const hasForecast = board.next !== undefined;
  // Without a forecast the current generation sits at the bottom
  const last = CHART_HEIGHT - EDGE - (hasForecast ? FORECAST_GAP : 0);
  const y = (index: number) => count === 1 ? last : round(EDGE + index * (last - EDGE) / (count - 1));
  const forecastY = CHART_HEIGHT - EDGE;
  const sign = higherIsGood ? 1 : -1;
  const columns = resources.map((resource): ChartColumn => {
    const normal = board.normal[resource];
    const fixed = resource === Resource.MEGACREDITS;
    // Solari stay fixed in the middle; the others by their favour, −2 … +4
    const x = (rate: number) => fixed ? 50 :
      round(SIDE + (sign * (rate - normal) - FAVOUR_MIN) / (FAVOUR_MAX - FAVOUR_MIN) * (100 - 2 * SIDE));
    const normalX = x(normal);
    const points = history.map((rates, index) => ({
      x: x(rates[resource]), y: y(index), mood: fixed ? 'normal' as Mood : moodOf(rates[resource], normal, higherIsGood), current: index === count - 1,
    }));
    // Area between the normal line and the rate, split where the rate crosses it
    const areas: Array<ChartArea> = [];
    for (let index = 0; index + 1 < count && !fixed; index++) {
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
    let forecast: ChartColumn['forecast'];
    if (board.next !== undefined) {
      const rate = board.next[resource];
      const point = {x: x(rate), y: forecastY, mood: fixed ? 'normal' as Mood : moodOf(rate, normal, higherIsGood), current: false};
      const from = points[points.length - 1];
      forecast = {point, line: `${from.x},${from.y} ${point.x},${point.y}`};
    }
    return {resource, normalX, line: points.map((point) => `${point.x},${point.y}`).join(' '), points, areas, forecast};
  });
  const rows: Array<ChartRow> = history.map((_, index) => ({
    generation: generation - (count - 1 - index), top: y(index), kind: index === count - 1 ? 'now' : 'past',
  }));
  if (hasForecast) {
    rows.push({generation: generation + 1, top: forecastY, kind: 'next'});
  }
  return {columns, rows, bandTop: y(count - 1)};
}

/** Distance of the current rate from the normal rate: its size, whether that is good for the player, and whether it is a
 *  peak (Jens, 22 Oct 2026: + and − against the base price instead of arrows) */
export function rateDeviation(board: ExchangeBoardModel, resource: Resource, higherIsGood: boolean): {delta: number, mood: Mood, peak: boolean} {
  const history = board.history;
  const now = history[history.length - 1][resource];
  const normal = board.normal[resource];
  const favour = (higherIsGood ? 1 : -1) * (now - normal);
  return {delta: now - normal, mood: moodOf(now, normal, higherIsGood), peak: favour >= PEAK_FAVOUR};
}
