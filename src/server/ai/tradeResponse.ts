import {SelectTradeResponse} from '../../common/inputs/InputResponse';
import {SelectTrade, tradeUnits} from '../inputs/SelectTrade';
import {RandomSource, integerBetween, pickOne} from './randomChoice';

// Answers of the AI to a trade input (SelectTrade, Dune expansion). The AI has no own trading strategy: the action
// lookahead values each answer on a game copy, these only build valid ones.

function response(input: SelectTrade, giveIndex: number, getIndex: number, units: number, getAmount?: number): SelectTradeResponse {
  const give = input.give[giveIndex];
  const others = input.get.filter((resource) => resource !== give.resource);
  const get = others[Math.min(getIndex, others.length - 1)];
  if (input.rate !== undefined) {
    return {type: 'trade', give: give.resource, giveAmount: units * input.rate.give, get, getAmount: units * input.rate.get};
  }
  return {type: 'trade', give: give.resource, giveAmount: units, get, getAmount: getAmount ?? 1};
}

/** A random but valid trade */
export function randomTradeResponse(input: SelectTrade, random: RandomSource): SelectTradeResponse {
  const giveIndex = input.give.indexOf(pickOne(random, input.give));
  const give = input.give[giveIndex];
  const others = input.get.filter((resource) => resource !== give.resource);
  const getIndex = others.indexOf(pickOne(random, others));
  if (input.rate !== undefined) {
    return response(input, giveIndex, getIndex, integerBetween(random, 1, tradeUnits(give, input.maxGet, input.rate)));
  }
  return response(input, giveIndex, getIndex, integerBetween(random, 1, give.max), integerBetween(random, 1, input.maxGet));
}

/** The quick answer: with a rate as much as possible of the largest stock, otherwise the smallest trade */
export function quickTradeResponse(input: SelectTrade): SelectTradeResponse {
  const largest = input.give.reduce((best, option, index) => option.max > input.give[best].max ? index : best, 0);
  if (input.rate !== undefined) {
    return response(input, largest, 0, tradeUnits(input.give[largest], input.maxGet, input.rate));
  }
  return response(input, largest, 0, 1, 1);
}
