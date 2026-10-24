import {Random} from '../../common/utils/Random';
import {Resource} from '../../common/Resource';
import {
  EXCHANGE_GOODS, ExchangeGood, ExchangePrices, ExchangeSide, FAVOUR_MAX, FAVOUR_MIN, FAVOUR_SUM_MAX, FAVOUR_SUM_MIN,
  NORMAL_BUY, NORMAL_SELL, favourOf,
} from '../../common/dune/smugglingExchange';

// Rates of the CHOAM exchange (common/dune/smugglingExchange.ts) and how they move from one generation to the next
// (Jens 20 and 24 Oct 2026, _mockups/dune/choam/choam-prototyp.html):
// - Per board one rate moves 1 in the player's favour and another 1 against. About one generation in six brings a
//   jump: one rate ±2, two others ∓1 (or one ∓2).
// - Then, a little less than every other generation, a surplus step of 1 in favour or against, on a good chance picks;
//   the favours of a board always add up to 0 … 2.
// - Guard rails: each rate 4 at most in the player's favour and 2 against, never below 1, and selling never above
//   buying the same good (trading there and back never pays).
// - Pull to the middle: the further a rate is from normal, the likelier it moves back.
// - The rates of the next generation are fixed one generation ahead: the forecast everybody sees.
// - Supply and demand (Jens 24 Oct 2026): what all players together sell and buy at the guild during a generation
//   moves that forecast at once – every 3 units of a good sold net lower its next selling rate by 1, every 3 bought
//   net raise its next buying rate by 1, within the same guard rails.

export type ExchangeData = {
  /** Rates per generation, the current one last */
  sell: Array<ExchangePrices>,
  buy: Array<ExchangePrices>,
  /** Rates of the next generation (the forecast); games from before it get it at their next generation end */
  next?: {sell: ExchangePrices, buy: ExchangePrices},
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
export function forecastOf(data: ExchangeData): {sell: ExchangePrices, buy: ExchangePrices} | undefined {
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
  return {sell, buy};
}

/** About one generation in six brings a jump */
const JUMP_CHANCE = 1 / 6;
/** Chance of the surplus step */
const SURPLUS_CHANCE = 0.45;

/** New exchange at the normal rates; with `rng` also the forecast of generation 2 */
export function initializeExchange(rng?: Random): ExchangeData {
  const data: ExchangeData = {sell: [{...NORMAL_SELL}], buy: [{...NORMAL_BUY}]};
  if (rng !== undefined) {
    data.next = nextRates(currentRates(data.sell), currentRates(data.buy), rng);
  }
  return data;
}

export function currentRates(rates: ReadonlyArray<ExchangePrices>): ExchangePrices {
  return rates[rates.length - 1];
}

/** Weighted pick; weights of 0 or less are left out */
function pick<T>(items: ReadonlyArray<T>, weight: (item: T) => number, rng: Random): T | undefined {
  const weighted = items.map((item) => ({item, weight: weight(item)})).filter((entry) => entry.weight > 0);
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (total === 0) {
    return undefined;
  }
  let roll = rng.next() * total;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll < 0) {
      return entry.item;
    }
  }
  return weighted[weighted.length - 1].item;
}

/** Whether a rate may stand: inside the favour range, at least 1, and against the other board (selling ≤ buying) */
type Allowed = (good: ExchangeGood, rate: number) => boolean;

function boardAllowed(side: ExchangeSide, other: ExchangePrices | undefined): Allowed {
  return (good, rate) => {
    const favour = favourOf(side, good, rate);
    if (rate < 1 || favour < FAVOUR_MIN || favour > FAVOUR_MAX) {
      return false;
    }
    if (other === undefined) {
      return true;
    }
    return side === 'sell' ? rate <= other[good] : rate >= other[good];
  };
}

const SIGN: Readonly<Record<ExchangeSide, number>> = {sell: 1, buy: -1};

/** One try of the given steps (in favour units), each good chosen weighted towards normal; undefined when a step finds no good */
function tryMoves(side: ExchangeSide, prices: ExchangePrices, steps: ReadonlyArray<number>, allowed: Allowed, rng: Random): ExchangePrices | undefined {
  const next = {...prices};
  const used = new Set<ExchangeGood>();
  for (const step of steps) {
    const good = pick(EXCHANGE_GOODS.filter((candidate) => !used.has(candidate) && allowed(candidate, next[candidate] + SIGN[side] * step)),
      // Moving in favour is likelier where the rate stands against the player, and the other way round
      (candidate) => FAVOUR_MAX + 1 - Math.sign(step) * favourOf(side, candidate, next[candidate]), rng);
    if (good === undefined) {
      return undefined;
    }
    used.add(good);
    next[good] += SIGN[side] * step;
  }
  return next;
}

/** Tries before a jump falls back to a normal move, and a normal move to standing still */
const TRIES = 8;

function favourSum(side: ExchangeSide, prices: ExchangePrices): number {
  return EXCHANGE_GOODS.reduce((sum, good) => sum + favourOf(side, good, prices[good]), 0);
}

/** One generation further on one board. A jump that does not fit becomes a normal move; if nothing fits it stays. */
function moveBoard(side: ExchangeSide, prices: ExchangePrices, allowed: Allowed, rng: Random): ExchangePrices {
  const sign = rng.next() < 0.5 ? 1 : -1;
  const plans = rng.next() < JUMP_CHANCE ? [[2 * sign, -sign, -sign], [2 * sign, -2 * sign], [1, -1]] : [[1, -1]];
  let next = {...prices};
  found: for (const steps of plans) {
    for (let attempt = 0; attempt < TRIES; attempt++) {
      const moved = tryMoves(side, prices, steps, allowed, rng);
      if (moved !== undefined) {
        next = moved;
        break found;
      }
    }
  }
  // Surplus: the sum may wander within 0 … 2 – where it lands, chance decides
  if (rng.next() < SURPLUS_CHANCE) {
    const sum = favourSum(side, next);
    const direction = sum <= FAVOUR_SUM_MIN ? 1 : sum >= FAVOUR_SUM_MAX ? -1 : (rng.next() < 0.5 ? 1 : -1);
    const good = pick(EXCHANGE_GOODS.filter((candidate) => allowed(candidate, next[candidate] + SIGN[side] * direction)), () => 1, rng);
    if (good !== undefined) {
      next[good] += SIGN[side] * direction;
    }
  }
  return next;
}

/** Rates of the generation after `sell`/`buy`: buying first, then selling stays below it */
function nextRates(sell: ExchangePrices, buy: ExchangePrices, rng: Random): {sell: ExchangePrices, buy: ExchangePrices} {
  // Buying never falls below the selling price it meets, and selling then never rises above the new buying price
  const nextBuy = moveBoard('buy', buy, boardAllowed('buy', sell), rng);
  const nextSell = moveBoard('sell', sell, boardAllowed('sell', nextBuy), rng);
  return {sell: nextSell, buy: nextBuy};
}

/** End of a generation: the forecast becomes the current rates, and the exchange fixes the next forecast */
export function advanceExchange(data: ExchangeData, rng: Random): void {
  // Games from before the forecast: the rates of this step are drawn now; supply and demand move them
  const next = forecastOf(data) ?? nextRates(currentRates(data.sell), currentRates(data.buy), rng);
  data.sell.push(next.sell);
  data.buy.push(next.buy);
  data.flow = undefined;
  data.next = nextRates(next.sell, next.buy, rng);
}
