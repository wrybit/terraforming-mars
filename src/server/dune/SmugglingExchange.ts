import {Random} from '../../common/utils/Random';
import {Resource} from '../../common/Resource';
import {
  EXCHANGE_GOODS, ExchangeGood, ExchangePrices, ExchangeSide, FAVOUR_MAX, FAVOUR_MIN, MARKET_MAX, MARKET_MIN,
  NORMAL_BUY, NORMAL_SELL, boardSumBand, favourOf, rateAtFavour,
} from '../../common/dune/smugglingExchange';

// Rates of the CHOAM exchange (common/dune/smugglingExchange.ts) and how they move from one generation to the next
// (Jens 27 Oct 2026, variant D of _mockups/dune/choam/kurs-dynamik.html):
// - A global market mood from −2 (slump) to +3 (boom) moves 1 every generation and mostly keeps its direction, so
//   booms and slumps last a few generations.
// - Each board (selling, buying) makes 10 tries per generation. A try moves one rate 1 (or, now and then, 2); half of
//   the tries are pairs: what one good gains, another loses. Whether a try is taken follows a target distribution of
//   the favours −2 … +4, tilted by the market mood (Metropolis step): in a boom +3 and +4 come up often, in a slump the
//   rates slide below normal.
// - The favours of a board keep to a band that moves with the market mood (boardSumBand); when the mood moves the
//   band away, the rates follow within a generation or two.
// - No rate stays the same longer than 2 generations: one that would, moves now – if needed with a counter move on
//   another good of its board.
// - Guard rails: each rate 4 at most in the player's favour and 2 against, never below 1, and selling never above
//   buying the same good (trading there and back never pays).
// - The rates of the next generation are fixed one generation ahead: the forecast everybody sees.
// - Supply and demand (Jens 24 Oct 2026): what all players together sell and buy at the guild during a generation
//   moves that forecast at once – every 3 units of a good sold net lower its next selling rate by 1, every 3 bought
//   net raise its next buying rate by 1, within the same guard rails.

export type ExchangeData = {
  /** Rates per generation, the current one last */
  sell: Array<ExchangePrices>,
  buy: Array<ExchangePrices>,
  /** Market mood per generation, the current one last; missing in games from before it (exchangeOf migrates them) */
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
 * most to 2 against the player (and not below 1), buying rises at most to 2 against; selling stays below buying.
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
      sell[good] = Math.max(sell[good] - steps, 1, NORMAL_SELL[good] + FAVOUR_MIN);
      sell[good] = Math.min(sell[good], data.next.sell[good]);
    } else if (net < 0) {
      buy[good] = Math.min(buy[good] + steps, NORMAL_BUY[good] - FAVOUR_MIN);
      buy[good] = Math.max(buy[good], data.next.buy[good]);
    }
  }
  return {sell, buy, market: data.next.market};
}

/** Base weights of the favours −2 … +4 before the market mood tilts them */
const FAVOUR_WEIGHTS: Readonly<Record<number, number>> = {[-2]: 12, [-1]: 22, 0: 26, 1: 18, 2: 10, 3: 7, 4: 5};
/** How strongly the market mood tilts the weights (per step of mood and favour, as an exponent) */
const MARKET_TILT = 0.5;
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

/** Target weight of a favour at a market mood; 0 outside −2 … +4 */
function weightOf(favour: number, market: number): number {
  return (FAVOUR_WEIGHTS[favour] ?? 0) * Math.exp(MARKET_TILT * market * favour);
}

function favourSum(side: ExchangeSide, prices: ExchangePrices): number {
  return EXCHANGE_GOODS.reduce((sum, good) => sum + favourOf(side, good, prices[good]), 0);
}

/** How far the favours of a board lie outside the band of the market mood (0 inside) */
function bandDistance(side: ExchangeSide, prices: ExchangePrices, market: number): number {
  const band = boardSumBand(market);
  const sum = favourSum(side, prices);
  return Math.max(0, band.min - sum, sum - band.max);
}

function inBand(side: ExchangeSide, prices: ExchangePrices, market: number): boolean {
  return bandDistance(side, prices, market) === 0;
}

/** Whether a rate may stand: inside the favour range, at least 1, and against the other board (selling ≤ buying) */
type Allowed = (good: ExchangeGood, rate: number) => boolean;

function boardAllowed(side: ExchangeSide, other: ExchangePrices): Allowed {
  return (good, rate) => {
    const favour = favourOf(side, good, rate);
    if (rate < 1 || favour < FAVOUR_MIN || favour > FAVOUR_MAX) {
      return false;
    }
    return side === 'sell' ? rate <= other[good] : rate >= other[good];
  };
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
function tryMove(side: ExchangeSide, prices: ExchangePrices, market: number, allowed: Allowed, rng: Random): void {
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
    const rate = rateAtFavour(side, good, favour + change);
    const weight = weightOf(favour + change, market);
    if (weight === 0 || !allowed(good, rate)) {
      return;
    }
    ratio *= weight / weightOf(favour, market);
    next[good] = rate;
  }
  // When the market mood moved the band away, a try may also close in on it
  const closesIn = inBand(side, next, market) || bandDistance(side, next, market) < bandDistance(side, prices, market);
  if (!closesIn || rng.next() > ratio) {
    return;
  }
  Object.assign(prices, next);
}

/**
 * Rates that stood the same for MAX_SAME_GENERATIONS generations move now: by the target distribution, and – when the
 * board would leave its band, otherwise in half of the cases – with a counter move on another good, never one pushed
 * back onto a value it already held that long.
 */
function moveStaleRates(side: ExchangeSide, prices: ExchangePrices, history: ReadonlyArray<ExchangePrices>, market: number, allowed: Allowed, rng: Random): void {
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
    const fits = (change: number) => allowed(good, rateAtFavour(side, good, favour + change));
    let options = [-2, -1, 1, 2].filter((change) => weightOf(favour + change, market) > 0 && fits(change));
    // The target distribution leaves nothing: then any step that fits
    if (options.length === 0) {
      options = [-1, 1].filter(fits);
    }
    if (options.length === 0) {
      continue;
    }
    // Draw the order in which the options are tried, weighted by the target distribution
    const order: Array<number> = [];
    const pool = [...options];
    while (pool.length > 0) {
      const weights = pool.map((change) => Math.max(weightOf(favour + change, market), 0.01) * (Math.abs(change) === 2 ? JUMP_CHANCE : 1));
      let roll = rng.next() * weights.reduce((sum, weight) => sum + weight, 0);
      let index = pool.length - 1;
      for (let candidate = 0; candidate < pool.length; candidate++) {
        roll -= weights[candidate];
        if (roll < 0) {
          index = candidate;
          break;
        }
      }
      order.push(pool.splice(index, 1)[0]);
    }
    const before = {...prices};
    // Fine when inside the band, or at least not further away than before
    const keepsBand = () => bandDistance(side, prices, market) <= bandDistance(side, before, market) || inBand(side, prices, market);
    const pair = rng.next() < PAIRED_CHANCE;
    const partners = EXCHANGE_GOODS.filter((other) => other !== good && !forced.has(other));
    const start = Math.floor(rng.next() * Math.max(1, partners.length));
    // A counter move on another good: first one that does not stall it, else any that fits
    const counterMove = (change: number): boolean => {
      for (const strict of [true, false]) {
        for (let offset = 0; offset < partners.length; offset++) {
          const other = partners[(start + offset) % partners.length];
          const otherFavour = favourOf(side, other, prices[other]) - change;
          const rate = rateAtFavour(side, other, otherFavour);
          if ((!strict || !stalled(other, rate)) && weightOf(otherFavour, market) > 0 && allowed(other, rate)) {
            prices[other] = rate;
            if (keepsBand()) {
              return true;
            }
            prices[other] = before[other];
          }
        }
      }
      return false;
    };
    let moved = false;
    for (const change of order) {
      prices[good] = rateAtFavour(side, good, favour + change);
      // Half of the forced moves come with a counter move; one that would leave the band always needs one
      if (!pair && keepsBand()) {
        moved = true;
        break;
      }
      if (counterMove(change) || (pair && keepsBand())) {
        moved = true;
        break;
      }
      Object.assign(prices, before);
    }
    // Nothing keeps the band: moving wins over the band (it comes back with the next tries)
    if (!moved) {
      prices[good] = rateAtFavour(side, good, favour + order[0]);
    }
  }
}

/** Rates of the generation after the given histories (current last) at the market mood of that generation */
function nextRates(sellHistory: ReadonlyArray<ExchangePrices>, buyHistory: ReadonlyArray<ExchangePrices>, market: number, rng: Random): {sell: ExchangePrices, buy: ExchangePrices} {
  const sell = {...currentRates(sellHistory)};
  const buy = {...currentRates(buyHistory)};
  // Buying never falls below the selling price it meets, and selling never rises above the buying price
  for (let attempt = 0; attempt < TRIES; attempt++) {
    tryMove('buy', buy, market, boardAllowed('buy', sell), rng);
    tryMove('sell', sell, market, boardAllowed('sell', buy), rng);
  }
  // Twice, because a counter move can meet a rate that moved meanwhile
  for (let pass = 0; pass < 2; pass++) {
    moveStaleRates('buy', buy, buyHistory, market, boardAllowed('buy', sell), rng);
    moveStaleRates('sell', sell, sellHistory, market, boardAllowed('sell', buy), rng);
  }
  return {sell, buy};
}

/** Starting rates drawn from the target distribution at mood 0, inside the band and with selling ≤ buying */
function startingRates(rng: Random): {sell: ExchangePrices, buy: ExchangePrices} {
  const total = Object.values(FAVOUR_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  const draw = () => {
    let roll = rng.next() * total;
    for (let favour = FAVOUR_MIN; favour <= FAVOUR_MAX; favour++) {
      roll -= FAVOUR_WEIGHTS[favour];
      if (roll < 0) {
        return favour;
      }
    }
    return 0;
  };
  for (let attempt = 0; attempt < 200; attempt++) {
    const sell = {...NORMAL_SELL};
    const buy = {...NORMAL_BUY};
    for (const good of EXCHANGE_GOODS) {
      sell[good] = rateAtFavour('sell', good, draw());
      buy[good] = rateAtFavour('buy', good, draw());
    }
    const fits = EXCHANGE_GOODS.every((good) => sell[good] >= 1 && sell[good] <= buy[good]);
    if (fits && inBand('sell', sell, 0) && inBand('buy', buy, 0)) {
      return {sell, buy};
    }
  }
  return {sell: {...NORMAL_SELL}, buy: {...NORMAL_BUY}};
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
  data.next = {...nextRates(data.sell, data.buy, market.level, rng), market: market.level};
}

/** New exchange: rates drawn from the target distribution (normal without `rng`); with `rng` also the forecast of generation 2 */
export function initializeExchange(rng?: Random): ExchangeData {
  const start = rng === undefined ? {sell: {...NORMAL_SELL}, buy: {...NORMAL_BUY}} : startingRates(rng);
  const data: ExchangeData = {sell: [start.sell], buy: [start.buy], market: [0], marketTrend: 0};
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

// Normal rates before 27 Oct 2026; games from then keep the favour of each rate (exchangeOf migrates them once)
const LEGACY_NORMAL_SELL: Readonly<Record<ExchangeGood, number>> = {steel: 2, titanium: 5, plants: 1, energy: 1, heat: 1};
const LEGACY_NORMAL_BUY: Readonly<Record<ExchangeGood, number>> = {steel: 4, titanium: 6, plants: 2, energy: 2, heat: 2};

/** Shift of a rate from the old to the new normal rates, which keeps its favour */
export function legacyShift(side: ExchangeSide, good: ExchangeGood): number {
  return side === 'sell' ? NORMAL_SELL[good] - LEGACY_NORMAL_SELL[good] : NORMAL_BUY[good] - LEGACY_NORMAL_BUY[good];
}

/** Moves the rates of a game from before the market mood onto the new normal rates; true when it did */
export function migrateExchange(data: ExchangeData): boolean {
  if (data.market !== undefined) {
    return false;
  }
  const shift = (side: ExchangeSide, prices: ExchangePrices) => {
    for (const good of EXCHANGE_GOODS) {
      prices[good] += legacyShift(side, good);
    }
  };
  data.sell.forEach((prices) => shift('sell', prices));
  data.buy.forEach((prices) => shift('buy', prices));
  if (data.next !== undefined) {
    shift('sell', data.next.sell);
    shift('buy', data.next.buy);
    data.next.market = 0;
  }
  data.market = data.sell.map(() => 0);
  data.marketTrend = 0;
  return true;
}
