import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {PlayerId} from '../../common/Types';
import {Resource} from '../../common/Resource';
import {SelectTrade} from '../inputs/SelectTrade';
import {SelectOption} from '../inputs/SelectOption';
import {InputError} from '../inputs/InputError';
import {message} from '../logs/MessageBuilder';
import {
  EXCHANGE_GOODS, ExchangeGood, ExchangePrices, ExchangeSide, orderBound, orderLimits, orderPremium, orderRefund,
} from '../../common/dune/smugglingExchange';
import {
  PROPHECY_MAX_UNITS, PROPHECY_MIN_UNITS, prophecyBudget, prophecyComesTrue, prophecyOutcome, prophecyPremium, prophecyRates,
} from '../../common/dune/prophecyOutcome';
import {PROPHECY_BUY_TITLE, PROPHECY_SELL_TITLE, PROPHECY_WITHDRAW_TITLE} from '../../common/dune/duneActionTitles';
import {ProphecyModel} from '../../common/dune/DuneModel';
import {RESOURCE_LABEL} from './resourceLabels';

// Prophecy of the CHOAM module (Jens 24 Oct 2026, _mockups/dune/choam/choam-prototyp.html): an order with a limit.
// - Placing it is an action: the goods (sell) or the Solari, amount × limit (buy), are bound at once.
// - At the end of each generation, after the new rates are set, an order whose limit the rate reaches comes true at
//   that rate: selling brings amount × rate plus the bet premium (amount × how far the limit lies above normal),
//   buying brings the goods and gives back what the rate stays below the limit.
// - Withdrawing (an action) gives back only half of what is bound, rounded down; at game end open orders are lost.
// The answer comes as a trade (SelectTrade, no new input type): selling gives the good (amount) and gets Solari
// (the limit), buying gives Solari (the limit) and gets the good (amount).
// Since 25 Oct 2026 (Jens; common/dune/prophecyOutcome.ts): 2 to 8 units, the limit fixed one step better than
// normal, the full bet premium on both sides; buying binds a budget (the units at the normal rate) and brings as many
// units as the budget buys at the new rate, rounded up. Orders placed before keep their old way (no `budget`).
// Since 25 Oct 2026, evening (Jens; _mockups/dune/choam/prophezeiung-layout.html): the player names the rate again
// (one column of the chart) and the prophecy brings exactly that column when the rate reaches it (`exact`). The
// answer of the trade carries the named rate as before: selling as the Solari got, buying as the Solari given.

export type ProphecyOrder = {
  id: number,
  player: PlayerId,
  side: ExchangeSide,
  good: ExchangeGood,
  amount: number,
  limit: number,
  /** Buy orders since 25 Oct 2026: the Solari bound; the order brings what they buy at the new rate */
  budget?: number,
  /** Since 25 Oct 2026, evening: brings exactly the column of its named rate (common/dune/prophecyOutcome.ts) */
  exact?: boolean,
};

export type ProphecyData = {
  orders: Array<ProphecyOrder>,
  nextId: number,
};

export function initializeProphecy(): ProphecyData {
  return {orders: [], nextId: 1};
}

function isExchangeGood(resource: Resource): resource is ExchangeGood {
  return (EXCHANGE_GOODS as ReadonlyArray<Resource>).includes(resource);
}

/** The bound part of an order: goods (selling) or Solari (buying) */
function boundOf(order: ProphecyOrder): number {
  return order.budget ?? orderBound(order.side, order.amount, order.limit);
}

function place(player: IPlayer, data: ProphecyData, side: ExchangeSide, good: ExchangeGood, amount: number, rate: number): void {
  if (amount < PROPHECY_MIN_UNITS || amount > PROPHECY_MAX_UNITS) {
    throw new InputError('A prophecy covers ' + PROPHECY_MIN_UNITS + ' to ' + PROPHECY_MAX_UNITS + ' units');
  }
  if (!prophecyRates(side, good).includes(rate)) {
    throw new InputError('This rate cannot be prophesied');
  }
  const budget = side === 'buy' ? prophecyBudget(good, amount) : undefined;
  if (budget !== undefined && player.megaCredits < budget) {
    throw new InputError('Not enough M€ for this order');
  }
  // Only that a prophecy was made is public, not its rate (Jens 25 Oct 2026); what it binds shows on the right
  player.game.log('${0} made a prophecy', (b) => b.player(player));
  if (budget === undefined) {
    player.stock.deduct(good, amount, {log: true});
  } else {
    player.stock.deduct(Resource.MEGACREDITS, budget, {log: true});
  }
  const order: ProphecyOrder = {id: data.nextId++, player: player.id, side, good, amount, limit: rate, exact: true};
  if (budget !== undefined) {
    order.budget = budget;
  }
  data.orders.push(order);
}

/** Placing a sell order: one trade, the good and amount given, Solari "got" as the limit */
export function sellOrderInput(player: IPlayer, data: ProphecyData, then: () => void): SelectTrade | undefined {
  const give = EXCHANGE_GOODS.filter((good) => player.stock.get(good) >= PROPHECY_MIN_UNITS)
    .map((good) => ({resource: good, max: Math.min(PROPHECY_MAX_UNITS, player.stock.get(good))}));
  if (give.length === 0) {
    return undefined;
  }
  const maxLimit = Math.max(...EXCHANGE_GOODS.map((good) => orderLimits('sell', good).max));
  return new SelectTrade(PROPHECY_SELL_TITLE, 'Prophesy', give, [Resource.MEGACREDITS], maxLimit).andThen((trade) => {
    if (!isExchangeGood(trade.give)) {
      throw new InputError('Only goods of the exchange can be sold');
    }
    place(player, data, 'sell', trade.give, trade.giveAmount, trade.getAmount);
    then();
    return undefined;
  });
}

/** Placing a buy order: one trade, Solari "given" as the limit, the good and amount got */
export function buyOrderInput(player: IPlayer, data: ProphecyData, then: () => void): SelectTrade | undefined {
  const cheapest = Math.min(...EXCHANGE_GOODS.map((good) => prophecyBudget(good, PROPHECY_MIN_UNITS)));
  if (player.megaCredits < cheapest) {
    return undefined;
  }
  // The client sends the named rate as Solari "given" and the units as the good "got"; the server binds the budget
  const maxLimit = Math.max(...EXCHANGE_GOODS.map((good) => orderLimits('buy', good).max));
  return new SelectTrade(PROPHECY_BUY_TITLE, 'Prophesy', [{resource: Resource.MEGACREDITS, max: maxLimit}], [...EXCHANGE_GOODS],
    PROPHECY_MAX_UNITS).andThen((trade) => {
    if (!isExchangeGood(trade.get)) {
      throw new InputError('Only goods of the exchange can be bought');
    }
    place(player, data, 'buy', trade.get, trade.getAmount, trade.giveAmount);
    then();
    return undefined;
  });
}

/** Withdrawing each own order: half of what it binds comes back (rounded down) */
export function withdrawOrderInputs(player: IPlayer, data: ProphecyData, then: () => void): Array<SelectOption> {
  return data.orders.filter((order) => order.player === player.id).map((order) =>
    new SelectOption(message(PROPHECY_WITHDRAW_TITLE, (b) => b.number(order.id)), 'Withdraw').andThen(() => {
      data.orders.splice(data.orders.indexOf(order), 1);
      const bound = boundOf(order);
      const back = orderRefund(bound);
      player.game.log('${0} withdrew a prophecy', (b) => b.player(player));
      player.stock.add(order.side === 'sell' ? order.good : Resource.MEGACREDITS, back, {log: true});
      then();
      return undefined;
    }));
}

/** End of a generation, after the new rates: orders whose limit is reached come true at the rate of the new generation */
export function fulfilOrders(game: IGame, data: ProphecyData, sell: ExchangePrices, buy: ExchangePrices): void {
  const open: Array<ProphecyOrder> = [];
  for (const order of data.orders) {
    const rate = order.side === 'sell' ? sell[order.good] : buy[order.good];
    if (order.exact === true) {
      if (prophecyComesTrue(order.side, order.limit, rate)) {
        payColumn(game, order);
      } else {
        open.push(order);
      }
      continue;
    }
    const comesTrue = order.side === 'sell' ? rate >= order.limit : rate <= order.limit;
    if (!comesTrue) {
      open.push(order);
      continue;
    }
    const player = game.getPlayerById(order.player);
    if (order.side === 'sell') {
      const premium = orderPremium('sell', order.good, order.amount, order.limit);
      game.log('Prophecy of ${0} came true: ${1} ${2} sold at ${3}, bet premium ${4}',
        (b) => b.player(player).number(order.amount).string(RESOURCE_LABEL[order.good]).number(rate).number(premium));
      player.stock.add(Resource.MEGACREDITS, order.amount * rate + premium, {log: true});
    } else if (order.budget !== undefined) {
      // Budget order of the afternoon of 25 Oct 2026: what the budget buys at the new rate plus 1 Solari premium per
      // unit, each converted at that rate and rounded up
      const units = Math.ceil(order.budget / rate) + Math.ceil(order.amount / rate);
      game.log('Prophecy of ${0} came true: ${1} ${2} for ${3} Solari at ${4}, bet premium included',
        (b) => b.player(player).number(units).string(RESOURCE_LABEL[order.good]).number(order.budget ?? 0).number(rate));
      player.stock.add(order.good, units, {log: true});
    } else {
      game.log('Prophecy of ${0} came true: ${1} ${2} bought at ${3}',
        (b) => b.player(player).number(order.amount).string(RESOURCE_LABEL[order.good]).number(rate));
      player.stock.add(order.good, order.amount, {log: true});
      const back = order.amount * (order.limit - rate);
      if (back > 0) {
        player.stock.add(Resource.MEGACREDITS, back, {log: true});
      }
    }
  }
  data.orders = open;
}

/** An exact order comes true: exactly the column of its named rate, logged at that rate */
function payColumn(game: IGame, order: ProphecyOrder): void {
  const player = game.getPlayerById(order.player);
  const outcome = prophecyOutcome(order.side, order.good, order.amount, order.limit);
  if (order.side === 'sell') {
    const premium = prophecyPremium('sell', order.good, order.amount, order.limit);
    game.log('Prophecy of ${0} came true: ${1} ${2} sold at ${3}, bet premium ${4}',
      (b) => b.player(player).number(order.amount).string(RESOURCE_LABEL[order.good]).number(order.limit).number(premium));
    player.stock.add(Resource.MEGACREDITS, outcome.total, {log: true});
  } else {
    game.log('Prophecy of ${0} came true: ${1} ${2} for ${3} Solari at ${4}, bet premium included',
      (b) => b.player(player).number(outcome.total).string(RESOURCE_LABEL[order.good]).number(order.budget ?? 0).number(order.limit));
    player.stock.add(order.good, outcome.total, {log: true});
  }
}

/** The viewer's own open orders (the others' stay hidden) */
export function prophecyModel(data: ProphecyData, viewer: IPlayer | undefined): ReadonlyArray<ProphecyModel> {
  if (viewer === undefined) {
    return [];
  }
  return data.orders.filter((order) => order.player === viewer.id).map((order) => ({
    id: order.id, side: order.side, good: order.good, amount: order.amount, limit: order.limit,
    premium: order.exact === true ? prophecyPremium(order.side, order.good, order.amount, order.limit) :
      orderPremium(order.side, order.good, order.amount, order.limit),
    ...(order.budget === undefined ? {} : {budget: order.budget}),
    ...(order.exact === true ? {payout: prophecyOutcome(order.side, order.good, order.amount, order.limit).total} : {}),
  }));
}
