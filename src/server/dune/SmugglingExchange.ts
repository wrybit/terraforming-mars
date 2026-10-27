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
//   below 1 Solari: what would fall below stays on the lowest rate (water sells for 1 at worst).
// - A global market mood from −2 (slump) to +2 (boom) moves 1 every generation, mostly keeping its direction, and
//   tilts that distribution a little: in a boom +3 and +4 come up more often.
// - Each board (selling, buying) makes 10 tries per generation (Metropolis steps). A try moves one rate 1 (or, now and
//   then, 2); half of the tries are pairs: what one good gains, another loses.
// - No rate stays the same longer than 2 generations: one that would, moves now, in half of the cases with a counter
//   move on another good of its board.
// - Selling may stand above buying the same good; trading there and back is blocked instead: a good bought from the
//   guild cannot be sold to it in the same generation, and the other way round (guildRoundTrip.ts).
// - The rates of the next generation are fixed one generation ahead: the forecast everybody sees.
// - Supply and demand (Jens 24 Oct 2026): what all players together sell and buy at the guild during a generation
//   moves that forecast at once – every 3 units of a good sold net lower its next selling rate by 1, every 3 bought
//   net raise its next buying rate by 1, within the same guard rails.

/** Version of the exchange data: 2 since variant G (27 Oct 2026); missing in games from before (exchangeOf migrates them) */
export const EXCHANGE_VERSION = 2;

export type ExchangeData = {
  /** Rates per generation, the current one last */
  sell: Array<ExchangePrices>,
  buy: Array<ExchangePrices>,
  version?: number,
  /** Market mood per generation, the current one last */
  market?: Array<number>,
  /** Direction the market mood last moved (−1, +1; 0 at the start) */
  marketTrend?: number,
  /** Rates (and market mood) of the next generation (the forecast); games from before it get it at their next generation end */
  next?: {sell: ExchangePrices, buy: ExchangePrices, market?: number},
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

/** Favours a rate can have: −2 … +4, cut where the rate would fall below 1 Solari (selling: below, buying: above) */
function favourRange(side: ExchangeSide, good: ExchangeGood): {low: number, high: number} {
  return side === 'sell' ?
    {low: Math.max(FAVOUR_MIN, 1 - NORMAL_SELL[good]), high: FAVOUR_MAX} :
    {low: FAVOUR_MIN, high: Math.min(FAVOUR_MAX, NORMAL_BUY[good] - 1)};
}

/** Target weight of a favour; the outermost possible one also carries the weight of those beyond it (0 outside) */
function targetWeight(side: ExchangeSide, good: ExchangeGood, favour: number): number {
  const {low, high} = favourRange(side, good);
  if (favour < low || favour > high) {
    return 0;
  }
  let weight = FAVOUR_WEIGHTS[favour];
  if (favour === low) {
    for (let beyond = FAVOUR_MIN; beyond < low; beyond++) {
      weight += FAVOUR_WEIGHTS[beyond];
    }
  }
  if (favour === high) {
    for (let beyond = high + 1; beyond <= FAVOUR_MAX; beyond++) {
      weight += FAVOUR_WEIGHTS[beyond];
    }
  }
  return weight;
}

function weightOf(side: ExchangeSide, good: ExchangeGood, favour: number, market: number): number {
  return targetWeight(side, good, favour) * Math.exp(MARKET_TILT * market * favour);
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

/** One try on one board (changes `prices` when taken): a single move or a pair, taken by the target distribution */
function tryMove(side: ExchangeSide, prices: ExchangePrices, market: number, rng: Random): void {
  const first = randomItem(EXCHANGE_GOODS, rng);
  const size = rng.next() < JUMP_CHANCE ? 2 : 1;
  const direction = rng.next() < 0.5 ? -1 : 1;
  const moves: Array<{good: ExchangeGood, change: number}> = [{good: first, change: direction * size}];
  if (rng.next() < PAIRED_CHANCE) {
    moves.push({good: randomItem(EXCHANGE_GOODS.filter((good) => good !== first), rng), change: -direction * size});
  }
  const next = {...prices};
  let ratio = 1;
  for (const {good, change} of moves) {
    const favour = favourOf(side, good, prices[good]);
    const weight = weightOf(side, good, favour + change, market);
    if (weight === 0) {
      return;
    }
    // A rate outside the distribution (an old game) always moves back in
    const current = weightOf(side, good, favour, market);
    ratio *= current === 0 ? Infinity : weight / current;
    next[good] = rateAtFavour(side, good, favour + change);
  }
  if (rng.next() > ratio) {
    return;
  }
  Object.assign(prices, next);
}

/** Weighted pick of a change; undefined when none has weight */
function pickChange(changes: ReadonlyArray<number>, weight: (change: number) => number, rng: Random): number | undefined {
  const weights = changes.map(weight);
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return undefined;
  }
  let roll = rng.next() * total;
  for (let index = 0; index < changes.length; index++) {
    roll -= weights[index];
    if (roll < 0) {
      return changes[index];
    }
  }
  return changes[changes.length - 1];
}

/**
 * Rates that stood the same for MAX_SAME_GENERATIONS generations move now, by the target distribution; in half of the
 * cases with a counter move on another good, never one pushed back onto a value it already held that long.
 */
function moveStaleRates(side: ExchangeSide, prices: ExchangePrices, history: ReadonlyArray<ExchangePrices>, market: number, rng: Random): void {
  if (history.length < MAX_SAME_GENERATIONS) {
    return;
  }
  const recent = history.slice(-MAX_SAME_GENERATIONS);
  const stalled = (good: ExchangeGood, rate: number) => recent.every((rates) => rates[good] === rate);
  const forced = new Set<ExchangeGood>();
  for (const good of EXCHANGE_GOODS) {
    if (!stalled(good, prices[good])) {
      continue;
    }
    forced.add(good);
    const favour = favourOf(side, good, prices[good]);
    const change = pickChange([-2, -1, 1, 2],
      (step) => weightOf(side, good, favour + step, market) * (Math.abs(step) === 2 ? JUMP_CHANCE : 1), rng);
    if (change === undefined) {
      continue;
    }
    prices[good] = rateAtFavour(side, good, favour + change);
    if (rng.next() > PAIRED_CHANCE) {
      continue;
    }
    const partners = EXCHANGE_GOODS.filter((other) => other !== good && !forced.has(other));
    const start = Math.floor(rng.next() * Math.max(1, partners.length));
    for (let offset = 0; offset < partners.length; offset++) {
      const other = partners[(start + offset) % partners.length];
      const otherFavour = favourOf(side, other, prices[other]) - change;
      const rate = rateAtFavour(side, other, otherFavour);
      if (weightOf(side, other, otherFavour, market) > 0 && !stalled(other, rate)) {
        prices[other] = rate;
        break;
      }
    }
  }
}

/** Rates of one board in the generation after its history (current last) at the market mood of that generation */
function nextBoard(side: ExchangeSide, history: ReadonlyArray<ExchangePrices>, market: number, rng: Random): ExchangePrices {
  const prices = {...currentRates(history)};
  for (let attempt = 0; attempt < TRIES; attempt++) {
    tryMove(side, prices, market, rng);
  }
  // Twice, because a counter move can meet a rate that stood still as well
  for (let pass = 0; pass < 2; pass++) {
    moveStaleRates(side, prices, history, market, rng);
  }
  return prices;
}

/** Starting rates drawn from the target distribution (at mood 0) */
function startingRates(side: ExchangeSide, rng: Random): ExchangePrices {
  const prices = {...(side === 'sell' ? NORMAL_SELL : NORMAL_BUY)};
  for (const good of EXCHANGE_GOODS) {
    const favours = [];
    for (let favour = FAVOUR_MIN; favour <= FAVOUR_MAX; favour++) {
      favours.push(favour);
    }
    prices[good] = rateAtFavour(side, good, pickChange(favours, (favour) => targetWeight(side, good, favour), rng) ?? 0);
  }
  return prices;
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
  data.next = {
    buy: nextBoard('buy', data.buy, market.level, rng),
    sell: nextBoard('sell', data.sell, market.level, rng),
    market: market.level,
  };
}

/** New exchange: rates drawn from the target distribution (normal without `rng`); with `rng` also the forecast of generation 2 */
export function initializeExchange(rng?: Random): ExchangeData {
  const sell = rng === undefined ? {...NORMAL_SELL} : startingRates('sell', rng);
  const buy = rng === undefined ? {...NORMAL_BUY} : startingRates('buy', rng);
  const data: ExchangeData = {sell: [sell], buy: [buy], version: EXCHANGE_VERSION, market: [0], marketTrend: 0};
  if (rng !== undefined) {
    drawForecast(data, rng);
  }
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
