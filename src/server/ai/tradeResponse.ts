import {SelectTradeResponse} from '../../common/inputs/InputResponse';
import {SelectTrade, tradeUnits} from '../inputs/SelectTrade';
import {pairGiveLimit, tradeRate} from '../../common/inputs/tradeRate';
import {Resource} from '../../common/Resource';
import {RandomSource, integerBetween, pickOne} from './randomChoice';

// Answers of the AI to a trade input (SelectTrade, Dune expansion). The AI has no own trading strategy: the action
// lookahead values each answer on a game copy, these only build valid ones.

/** Resources the AI can get for `give`: not the same one, and for a priced trade at least one unit affordable */
function receivable(input: SelectTrade, giveIndex: number): Array<Resource> {
  const give = input.give[giveIndex];
  return input.get.filter((resource) => {
    if (resource === give.resource) {
      return false;
    }
    const rate = tradeRate(input.pricing, give.resource, resource);
    return rate === undefined || tradeUnits(give, input.maxGet, rate, pairGiveLimit(input.pricing, give.resource, resource)) >= 1;
  });
}

function response(input: SelectTrade, giveIndex: number, get: Resource, units: number, getAmount?: number): SelectTradeResponse {
  const give = input.give[giveIndex];
  const rate = tradeRate(input.pricing, give.resource, get);
  if (rate !== undefined) {
    return {type: 'trade', give: give.resource, giveAmount: units * rate.give, get, getAmount: units * rate.get};
  }
  return {type: 'trade', give: give.resource, giveAmount: units, get, getAmount: getAmount ?? 1};
}

/** A random but valid trade */
export function randomTradeResponse(input: SelectTrade, random: RandomSource): SelectTradeResponse {
  const candidates = input.give.map((_option, index) => index).filter((index) => receivable(input, index).length > 0);
  const giveIndex = pickOne(random, candidates);
  const give = input.give[giveIndex];
  const get = pickOne(random, receivable(input, giveIndex));
  const rate = tradeRate(input.pricing, give.resource, get);
  if (rate !== undefined) {
    return response(input, giveIndex, get, integerBetween(random, 1, tradeUnits(give, input.maxGet, rate, pairGiveLimit(input.pricing, give.resource, get))));
  }
  return response(input, giveIndex, get, integerBetween(random, 1, give.max), integerBetween(random, 1, input.maxGet));
}

/** The quick answer: for a priced trade as much as possible of the largest stock, otherwise the smallest trade */
export function quickTradeResponse(input: SelectTrade): SelectTradeResponse {
  const candidates = input.give.map((_option, index) => index).filter((index) => receivable(input, index).length > 0);
  const giveIndex = candidates.reduce((best, index) => input.give[index].max > input.give[best].max ? index : best, candidates[0]);
  const give = input.give[giveIndex];
  const get = receivable(input, giveIndex)[0];
  const rate = tradeRate(input.pricing, give.resource, get);
  if (rate !== undefined) {
    return response(input, giveIndex, get, tradeUnits(give, input.maxGet, rate, pairGiveLimit(input.pricing, give.resource, get)));
  }
  return response(input, giveIndex, get, 1, 1);
}
