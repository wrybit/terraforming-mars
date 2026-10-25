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

export type ProphecyOrder = {
  id: number,
  player: PlayerId,
  side: ExchangeSide,
  good: ExchangeGood,
  amount: number,
  limit: number,
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

function place(player: IPlayer, data: ProphecyData, side: ExchangeSide, good: ExchangeGood, amount: number, limit: number): void {
  const range = orderLimits(side, good);
  if (limit < range.min || limit > range.max) {
    throw new InputError('The limit must lie between ' + range.min + ' and ' + range.max);
  }
  if (side === 'buy' && player.megaCredits < amount * limit) {
    throw new InputError('Not enough M€ for this order');
  }
  // Only that a prophecy was made is public, not its rate (Jens 25 Oct 2026); what it binds shows on the right
  player.game.log('${0} made a prophecy', (b) => b.player(player));
  if (side === 'sell') {
    player.stock.deduct(good, amount, {log: true});
  } else {
    player.stock.deduct(Resource.MEGACREDITS, amount * limit, {log: true});
  }
  data.orders.push({id: data.nextId++, player: player.id, side, good, amount, limit});
}

/** Placing a sell order: one trade, the good and amount given, Solari "got" as the limit */
export function sellOrderInput(player: IPlayer, data: ProphecyData, then: () => void): SelectTrade | undefined {
  const give = EXCHANGE_GOODS.filter((good) => player.stock.get(good) >= 1).map((good) => ({resource: good, max: player.stock.get(good)}));
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
  const cheapest = Math.min(...EXCHANGE_GOODS.map((good) => orderLimits('buy', good).min));
  if (player.megaCredits < cheapest) {
    return undefined;
  }
  const maxLimit = Math.max(...EXCHANGE_GOODS.map((good) => orderLimits('buy', good).max));
  return new SelectTrade(PROPHECY_BUY_TITLE, 'Prophesy', [{resource: Resource.MEGACREDITS, max: maxLimit}], [...EXCHANGE_GOODS],
    Math.floor(player.megaCredits / cheapest)).andThen((trade) => {
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
      const bound = orderBound(order.side, order.amount, order.limit);
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

/** The viewer's own open orders (the others' stay hidden) */
export function prophecyModel(data: ProphecyData, viewer: IPlayer | undefined): ReadonlyArray<ProphecyModel> {
  if (viewer === undefined) {
    return [];
  }
  return data.orders.filter((order) => order.player === viewer.id).map((order) => ({
    id: order.id, side: order.side, good: order.good, amount: order.amount, limit: order.limit,
    premium: orderPremium(order.side, order.good, order.amount, order.limit),
  }));
}
