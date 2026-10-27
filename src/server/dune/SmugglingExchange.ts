import {Random} from '../../common/utils/Random';
import {Resource} from '../../common/Resource';
import {
  EXCHANGE_GOODS, ExchangeGood, ExchangePrices, ExchangeSide, FAVOUR_MAX, FAVOUR_MIN, MARKET_MAX, MARKET_MIN,
  NORMAL_BUY, NORMAL_SELL, favourOf, rateAtFavour, worstRate,
} from '../../common/dune/smugglingExchange';

// Rates of the CHOAM exchange (common/dune/smugglingExchange.ts) and how they move from one generation to the next
// (Jens 27 Oct 2026, variant G of _mockups/dune/choam/kurs-dynamik.html). The normal rates stay as they are; only how
// often a rate leaves them changes:
// - Each rate follows a target distribution of its favour −2 … +4 (12 / 22 / 26 / 18 / 10 / 7 / 5 %). No rate goes
//   below 1 Solari: the draws below still happen and the rate stays on 1, so water sells for 1 more often, not more
//   often higher (Jens 27 Oct 2026).
// - A global market mood from −2 (slump) to +2 (boom) moves 1 every generation, mostly keeping its direction, and
//   tilts that distribution a little: in a boom +3 and +4 come up more often.
// - Each board (selling, buying) makes 10 tries per generation (Metropolis steps). A try moves one rate 1 (or, now and
//   then, 2); half of the tries are pairs: what one good gains, another loses.
// - No rate stays the same longer than 2 generations: one that would, moves now, in half of the cases with a counter
//   move on another good of its board. A rate on 1 Solari may stay there.
// - Selling may stand above buying the same good; trading there and back is blocked instead: a good bought from the
//   guild cannot be sold to it in the same generation, and the other way round (guildRoundTrip.ts).
// - The rates of the next generation are fixed one generation ahead: the forecast everybody sees.
// - Supply and demand (Jens 24 Oct 2026): what all players together sell and buy at the guild during a generation
//   moves that forecast at once – every 3 units of a good sold net lower its next selling rate by 1, every 3 bought
//   net raise its next buying rate by 1, within the same guard rails.

/** Version of the exchange data: 2 since variant G (27 Oct 2026); missing in games from before (exchangeOf migrates them) */
export const EXCHANGE_VERSION = 2;

/** Per good how many steps beyond 1 Solari a rate lies */
export type Depth = Partial<Record<ExchangeGood, number>>;

export type ExchangeData = {
  /** Rates per generation, the current one last */
  sell: Array<ExchangePrices>,
  buy: Array<ExchangePrices>,
  version?: number,
  /** Market mood per generation, the current one last */
  market?: Array<number>,
  /** Direction the market mood last moved (−1, +1; 0 at the start) */
  marketTrend?: number,
  /** How far beyond 1 Solari the current rates lie (see hiddenFavour); missing: nowhere */
  depth?: {sell: Depth, buy: Depth},
  /** Rates (and market mood) of the next generation (the forecast); games from before it get it at their next generation end */
  next?: {sell: ExchangePrices, buy: ExchangePrices, market?: number, depth?: {sell: Depth, buy: Depth}},
  /** Units of each good all players sold (+) and bought (−) at the guild this generation; missing: none */
  flow?: Partial<Record<ExchangeGood, number>>,
};

/** Every this many units sold or bought net move the next rate by 1 */
export const SUPPLY_STEP = 3;

function isExchangeGood(resource: Resource): resource is ExchangeGood {
  return (EXCHANGE_GOODS as ReadonlyArray<Resource>).includes(resource);
}

/** A guild trade: the given good counts as supply, the received one as demand (Solari do not count) */
export function recordTrade(data: ExchangeData, give: Resource, giveAmount: number, get: Resource, getAmount: number): void {
  const flow = {...data.flow};
  if (isExchangeGood(give)) {
    flow[give] = (flow[give] ?? 0) + giveAmount;
  }
  if (isExchangeGood(get)) {
    flow[get] = (flow[get] ?? 0) - getAmount;
  }
  data.flow = flow;
}

/**
 * The rates of the next generation as they stand now: the drawn forecast moved by supply and demand. Selling falls at
 * most to 2 against the player (and not below 1), buying rises at most to 2 against.
 */
export function forecastOf(data: ExchangeData): {sell: ExchangePrices, buy: ExchangePrices, market?: number} | undefined {
  if (data.next === undefined) {
    return undefined;
  }
  const sell = {...data.next.sell};
  const buy = {...data.next.buy};
  for (const good of EXCHANGE_GOODS) {
    const net = data.flow?.[good] ?? 0;
    const steps = Math.floor(Math.abs(net) / SUPPLY_STEP);
    if (net > 0) {
      sell[good] = Math.min(data.next.sell[good], Math.max(sell[good] - steps, worstRate('sell', good)));
    } else if (net < 0) {
      buy[good] = Math.max(data.next.buy[good], Math.min(buy[good] + steps, worstRate('buy', good)));
    }
  }
  return {sell, buy, market: data.next.market};
}

/** Target weights of the favours −2 … +4 before the market mood tilts them */
const FAVOUR_WEIGHTS: Readonly<Record<number, number>> = {[-2]: 12, [-1]: 22, 0: 26, 1: 18, 2: 10, 3: 7, 4: 5};
/** How strongly the market mood tilts the weights (per step of mood and favour, as an exponent) */
const MARKET_TILT = 0.15;
/** Tries per board and generation */
const TRIES = 10;
/** Chance that a try moves 2 instead of 1 */
const JUMP_CHANCE = 0.4;
/** Chance that a try is a pair: the counter move on another good of the same board */
const PAIRED_CHANCE = 0.5;
/** Chance that the market mood keeps its direction */
const MARKET_MOMENTUM = 0.65;
/** No rate stays the same longer than this many generations */
export const MAX_SAME_GENERATIONS = 2;

/** Favours a rate can show: −2 … +4, cut where the rate would fall below 1 Solari (selling: below, buying: above) */
function favourRange(side: ExchangeSide, good: ExchangeGood): {low: number, high: number} {
  return side === 'sell' ?
    {low: Math.max(FAVOUR_MIN, 1 - NORMAL_SELL[good]), high: FAVOUR_MAX} :
    {low: FAVOUR_MIN, high: Math.min(FAVOUR_MAX, NORMAL_BUY[good] - 1)};
}

/**
 * The favour behind a rate. The exchange draws every favour −2 … +4, also those below 1 Solari (Jens 27 Oct 2026:
 * statistically the step down still happens, the rate just stays on 1). How far beyond 1 Solari a rate lies is kept in
 * `depth`, so water sells for 1 as often as the draws below it say.
 */
function hiddenFavour(side: ExchangeSide, good: ExchangeGood, rate: number, depth: Depth | undefined): number {
  const beyond = depth?.[good] ?? 0;
  return favourOf(side, good, rate) + (side === 'sell' ? -beyond : beyond);
}

/** The rate a favour shows (at least 1 Solari) and how far beyond 1 Solari it lies */
function shownRate(side: ExchangeSide, good: ExchangeGood, favour: number): {rate: number, beyond: number} {
  const {low, high} = favourRange(side, good);
  const shown = Math.min(high, Math.max(low, favour));
  return {rate: rateAtFavour(side, good, shown), beyond: Math.abs(favour - shown)};
}

/** Target weight of a favour at a market mood; 0 outside −2 … +4 */
function weightOf(favour: number, market: number): number {
  return (FAVOUR_WEIGHTS[favour] ?? 0) * Math.exp(MARKET_TILT * market * favour);
}

function randomItem<T>(items: ReadonlyArray<T>, rng: Random): T {
  return items[Math.floor(rng.next() * items.length)];
}

/** Next market mood: one step, mostly in the same direction; at the edges it turns */
function nextMarket(level: number, trend: number, rng: Random): {level: number, trend: number} {
  let direction = trend;
  if (direction === 0 || rng.next() > MARKET_MOMENTUM) {
    direction = rng.next() < 0.5 ? -1 : 1;
  }
  if (level + direction > MARKET_MAX || level + direction < MARKET_MIN) {
    direction = -direction;
  }
  return {level: level + direction, trend: direction};
}

type Favours = Record<ExchangeGood, number>;

/** One try on one board (changes `favours` when taken): a single move or a pair, taken by the target distribution */
function tryMove(favours: Favours, market: number, rng: Random): void {
  const first = randomItem(EXCHANGE_GOODS, rng);
  const size = rng.next() < JUMP_CHANCE ? 2 : 1;
  const direction = rng.next() < 0.5 ? -1 : 1;
  const moves: Array<{good: ExchangeGood, change: number}> = [{good: first, change: direction * size}];
  if (rng.next() < PAIRED_CHANCE) {
    moves.push({good: randomItem(EXCHANGE_GOODS.filter((good) => good !== first), rng), change: -direction * size});
  }
  let ratio = 1;
  for (const {good, change} of moves) {
    const weight = weightOf(favours[good] + change, market);
    if (weight === 0) {
      return;
    }
    // A favour outside the distribution (an old game) always moves back in
    const current = weightOf(favours[good], market);
    ratio *= current === 0 ? Infinity : weight / current;
  }
  if (rng.next() > ratio) {
    return;
  }
  for (const {good, change} of moves) {
    favours[good] += change;
  }
}

/** Weighted pick; undefined when nothing has weight */
function pickWeighted(items: ReadonlyArray<number>, weight: (item: number) => number, rng: Random): number | undefined {
  const weights = items.map(weight);
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return undefined;
  }
  let roll = rng.next() * total;
  for (let index = 0; index < items.length; index++) {
    roll -= weights[index];
    if (roll < 0) {
      return items[index];
    }
  }
  return items[items.length - 1];
}

/**
 * Favours whose rate stood the same for MAX_SAME_GENERATIONS generations move now, by the target distribution; in
 * half of the cases with a counter move on another good, never one pushed back onto a rate it already held that long.
 * A rate on 1 Solari may stay there: the draws below 1 keep it.
 */
function moveStaleRates(side: ExchangeSide, favours: Favours, history: ReadonlyArray<ExchangePrices>, market: number, rng: Random): void {
  if (history.length < MAX_SAME_GENERATIONS) {
    return;
  }
  const recent = history.slice(-MAX_SAME_GENERATIONS);
  const stalled = (good: ExchangeGood, favour: number) => recent.every((rates) => rates[good] === shownRate(side, good, favour).rate);
  const forced = new Set<ExchangeGood>();
  for (const good of EXCHANGE_GOODS) {
    // On 1 Solari a rate may stay: the draws below 1 keep it there (Jens 27 Oct 2026)
    if (!stalled(good, favours[good]) || shownRate(side, good, favours[good]).rate === 1) {
      continue;
    }
    forced.add(good);
    const change = pickWeighted([-2, -1, 1, 2],
      (step) => weightOf(favours[good] + step, market) * (Math.abs(step) === 2 ? JUMP_CHANCE : 1), rng);
    if (change === undefined) {
      continue;
    }
    favours[good] += change;
    if (rng.next() > PAIRED_CHANCE) {
      continue;
    }
    const partners = EXCHANGE_GOODS.filter((other) => other !== good && !forced.has(other));
    const start = Math.floor(rng.next() * Math.max(1, partners.length));
    for (let offset = 0; offset < partners.length; offset++) {
      const other = partners[(start + offset) % partners.length];
      const otherFavour = favours[other] - change;
      if (weightOf(otherFavour, market) > 0 && !stalled(other, otherFavour)) {
        favours[other] = otherFavour;
        break;
      }
    }
  }
}

/** Rates of one board in the generation after its history (current last) at the market mood of that generation */
function nextBoard(side: ExchangeSide, history: ReadonlyArray<ExchangePrices>, depth: Depth | undefined, market: number, rng: Random): {rates: ExchangePrices, depth: Depth} {
  const current = currentRates(history);
  const favours = {} as Favours;
  for (const good of EXCHANGE_GOODS) {
    favours[good] = hiddenFavour(side, good, current[good], depth);
  }
  for (let attempt = 0; attempt < TRIES; attempt++) {
    tryMove(favours, market, rng);
  }
  // Twice, because a counter move can meet a rate that stood still as well
  for (let pass = 0; pass < 2; pass++) {
    moveStaleRates(side, favours, history, market, rng);
  }
  return shownRates(side, favours);
}

function shownRates(side: ExchangeSide, favours: Favours): {rates: ExchangePrices, depth: Depth} {
  const rates = {...(side === 'sell' ? NORMAL_SELL : NORMAL_BUY)};
  const depth: Depth = {};
  for (const good of EXCHANGE_GOODS) {
    const shown = shownRate(side, good, favours[good]);
    rates[good] = shown.rate;
    if (shown.beyond > 0) {
      depth[good] = shown.beyond;
    }
  }
  return {rates, depth};
}

/** Starting rates drawn from the target distribution (at mood 0) */
function startingRates(side: ExchangeSide, rng: Random): {rates: ExchangePrices, depth: Depth} {
  const favours = {} as Favours;
  const all = [-2, -1, 0, 1, 2, 3, 4];
  for (const good of EXCHANGE_GOODS) {
    favours[good] = pickWeighted(all, (favour) => weightOf(favour, 0), rng) ?? 0;
  }
  return shownRates(side, favours);
}

export function currentRates(rates: ReadonlyArray<ExchangePrices>): ExchangePrices {
  return rates[rates.length - 1];
}

/** Market mood of the current generation; 0 in games from before it */
export function currentMarket(data: ExchangeData): number {
  return data.market?.[data.market.length - 1] ?? 0;
}

/** The forecast of the generation after the current one, with the market mood moving on */
function drawForecast(data: ExchangeData, rng: Random): void {
  const market = nextMarket(currentMarket(data), data.marketTrend ?? 0, rng);
  data.marketTrend = market.trend;
  const buy = nextBoard('buy', data.buy, data.depth?.buy, market.level, rng);
  const sell = nextBoard('sell', data.sell, data.depth?.sell, market.level, rng);
  data.next = {sell: sell.rates, buy: buy.rates, market: market.level, depth: {sell: sell.depth, buy: buy.depth}};
}

/** New exchange: rates drawn from the target distribution (normal without `rng`); with `rng` also the forecast of generation 2 */
export function initializeExchange(rng?: Random): ExchangeData {
  if (rng === undefined) {
    return {sell: [{...NORMAL_SELL}], buy: [{...NORMAL_BUY}], version: EXCHANGE_VERSION, market: [0], marketTrend: 0};
  }
  const sell = startingRates('sell', rng);
  const buy = startingRates('buy', rng);
  const data: ExchangeData = {
    sell: [sell.rates], buy: [buy.rates], depth: {sell: sell.depth, buy: buy.depth}, version: EXCHANGE_VERSION, market: [0], marketTrend: 0,
  };
  drawForecast(data, rng);
  return data;
}

/** End of a generation: the forecast becomes the current rates, and the exchange fixes the next forecast */
export function advanceExchange(data: ExchangeData, rng: Random): void {
  // Games from before the forecast: the rates of this step are drawn now; supply and demand move them
  if (data.next === undefined) {
    drawForecast(data, rng);
  }
  const next = forecastOf(data);
  if (next === undefined) {
    return;
  }
  const market = next.market ?? currentMarket(data);
  data.depth = data.next?.depth;
  data.sell.push(next.sell);
  data.buy.push(next.buy);
  data.market = [...(data.market ?? data.sell.slice(0, -1).map(() => 0)), market];
  data.flow = undefined;
  drawForecast(data, rng);
}

// Normal rates of variant D (27 Oct 2026, morning: doubled, withdrawn the same day). Games from those hours move back
// onto the normal rates, keeping the favour of each rate as far as 1 Solari allows.
const DOUBLED_SELL: Readonly<Record<ExchangeGood, number>> = {steel: 4, titanium: 10, plants: 3, energy: 3, heat: 3};
const DOUBLED_BUY: Readonly<Record<ExchangeGood, number>> = {steel: 9, titanium: 15, plants: 7, energy: 7, heat: 7};

/** Rate of a game from variant D on the normal rates (same favour, at least 1 Solari) */
export function undoubledRate(side: ExchangeSide, good: ExchangeGood, rate: number): number {
  const doubled = side === 'sell' ? DOUBLED_SELL[good] : DOUBLED_BUY[good];
  return Math.max(1, rate - doubled + (side === 'sell' ? NORMAL_SELL[good] : NORMAL_BUY[good]));
}

/**
 * Brings an exchange onto version 2: games from before the market mood get one (rates unchanged), games from variant
 * D move back onto the normal rates. Returns 'doubled' when it undid variant D (open prophecies have to follow).
 */
export function migrateExchange(data: ExchangeData): 'doubled' | 'added' | undefined {
  if (data.version === EXCHANGE_VERSION) {
    return undefined;
  }
  data.version = EXCHANGE_VERSION;
  if (data.market === undefined) {
    data.market = data.sell.map(() => 0);
    data.marketTrend = 0;
    if (data.next !== undefined) {
      data.next.market = 0;
    }
    return 'added';
  }
  const undouble = (side: ExchangeSide, prices: ExchangePrices) => {
    for (const good of EXCHANGE_GOODS) {
      prices[good] = undoubledRate(side, good, prices[good]);
    }
  };
  data.sell.forEach((prices) => undouble('sell', prices));
  data.buy.forEach((prices) => undouble('buy', prices));
  if (data.next !== undefined) {
    undouble('sell', data.next.sell);
    undouble('buy', data.next.buy);
  }
  return 'doubled';
}
