import {IGame} from '../IGame';
import {BRIBE_TITLE, SMUGGLE_TITLE} from '../../common/dune/duneActionTitles';
import {IPlayer} from '../IPlayer';
import {PlayerId} from '../../common/Types';
import {ALL_RESOURCES, Resource} from '../../common/Resource';
import {TileType} from '../../common/TileType';
import {Random} from '../../common/utils/Random';
import {SelectOption} from '../inputs/SelectOption';
import {SelectTrade} from '../inputs/SelectTrade';
import {SelectPayment} from '../inputs/SelectPayment';
import {tradeRate} from '../../common/inputs/tradeRate';
import {NORMAL_BUY, NORMAL_SELL} from '../../common/dune/smugglingExchange';
import {ExchangeData, advanceExchange, currentRates, forecastOf, initializeExchange, recordTrade} from './SmugglingExchange';
import {PlayerInput} from '../PlayerInput';
import {message} from '../logs/MessageBuilder';
import {COSTLY_SUSPICION, MAX_SUSPICION, SmugglingModel, suspicionPenalty} from '../../common/dune/DuneModel';
import {CardName} from '../../common/cards/CardName';
import {payWithLog} from './payWithLog';
import {PrivilegeData, announcePrivilege, lapsePrivilege, newPrivilege, privilegeModel, renewPrivilege} from './Privilege';
import {ProphecyData, fulfilOrders, initializeProphecy, prophecyModel} from './Prophecy';

// Exchange, envy and tribute of the CHOAM module (claude/dune-erweiterung-konzept.md; Jens 19–24 Oct 2026). Smuggling
// and the CHOAM contracts became one module "CHOAM" with five moves in one action tab (ChoamExchange.ts): guild
// (trade at the rates of the day), prophecy (orders), privilege (the emperor's wish), pacts (offers between players,
// Choam.ts) and tribute. The data keeps its old name `smuggling`, so saved games load.
// - Guild: any resource for another at the rates of this generation (SmugglingExchange.ts), moving spice included.
// - Every move but the tribute raises the envy of the great houses by 1 (the former suspicion track). Checked at the
//   end of the generation: 0 to 2 free, 3 −1 TR (Landsraad influence), 4 −2, 5 −3; then the grudge is over (back to
//   0). At 5 every move but the tribute is closed (Jens 24 Oct 2026: one free step more).
// - Tribute: 10 M€ (owner of the Smugglers' market tile – Industrial Center – 7), envy −1.

export type SmugglingData = {
  /** Envy of the great houses per player (formerly suspicion) */
  suspicion: Record<PlayerId, number>,
  /** Guild deals each player made (milestone Smuggler King, dune/goals); missing in older games */
  deals?: Record<PlayerId, number>,
  /** Rates of the exchange; games from before the exchange get it on first use */
  exchange?: ExchangeData,
  /** The emperor's privilege of this generation; games from before it get one on first use */
  privilege?: PrivilegeData,
  /** The privilege of the next generation, drawn ahead so players can prepare (Jens 25 Oct 2026) */
  nextPrivilege?: PrivilegeData,
  /** Prophecies (orders) of all players */
  prophecy?: ProphecyData,
};

export {MAX_SUSPICION};
export const MAX_SPICE_PER_DEAL = 5;
export const BRIBE_COST = 10;
export const BRIBE_COST_WITH_MARKET = 7;
/** No upper limit on what a guild trade pays out (the stock limits it) */
const NO_LIMIT = 9999;

export function initializeSmuggling(rng?: Random, generation = 1): SmugglingData {
  return {
    suspicion: {},
    exchange: initializeExchange(rng),
    privilege: rng === undefined ? undefined : newPrivilege(generation, rng),
    nextPrivilege: rng === undefined ? undefined : newPrivilege(generation + 1, rng),
    prophecy: initializeProphecy(),
  };
}

/** The exchange of the game; added on first use to games from before it */
export function exchangeOf(data: SmugglingData): ExchangeData {
  data.exchange ??= initializeExchange();
  return data.exchange;
}

export function prophecyOf(data: SmugglingData): ProphecyData {
  data.prophecy ??= initializeProphecy();
  return data.prophecy;
}

/** The guild's sell rates of this generation (what the privilege of this generation pays by) */
export function currentSellRates(data: SmugglingData) {
  return currentRates(exchangeOf(data).sell);
}

/** The privilege of this generation; games from before it get one, picked by the generation (no random numbers) */
export function privilegeOf(game: IGame, data: SmugglingData): PrivilegeData {
  data.privilege ??= newPrivilege(game.generation);
  return data.privilege;
}

/** The privilege of the next generation; games from before the preview get one picked by the generation */
export function nextPrivilegeOf(game: IGame, data: SmugglingData): PrivilegeData {
  const generation = privilegeOf(game, data).generation + 1;
  if (data.nextPrivilege?.generation !== generation) {
    data.nextPrivilege = newPrivilege(generation);
  }
  return data.nextPrivilege;
}

/** Prices of the current generation: what one given unit brings (sell) and what one received unit costs (buy) */
function currentPricing(data: SmugglingData) {
  const exchange = exchangeOf(data);
  const sell = currentRates(exchange.sell);
  const buy = currentRates(exchange.buy);
  // Moving spice is the same deal at the exchange rate, only limited to 5 spice
  const spicePair = {give: Resource.TITANIUM, get: Resource.MEGACREDITS, rate: {give: 1, get: sell.titanium}, maxGive: MAX_SPICE_PER_DEAL};
  return {values: {...sell}, buyValues: {...buy}, spicePair};
}

/** Level of the envy, at most the top of the track */
export function suspicionOf(data: SmugglingData, player: IPlayer): number {
  return Math.min(MAX_SUSPICION, data.suspicion[player.id] ?? 0);
}

/** At the top of the track every move but the tribute is closed */
export function envyFull(data: SmugglingData, player: IPlayer): boolean {
  return suspicionOf(data, player) >= MAX_SUSPICION;
}

/**
 * Sets the envy of a player and logs the change as its own line ("gained/lost N envy"), so the log shows it on the
 * right of the move that caused it (logActions.ts; Jens 25 Oct 2026)
 */
export function setEnvy(player: IPlayer, data: SmugglingData, level: number): void {
  const before = suspicionOf(data, player);
  const after = Math.max(0, Math.min(MAX_SUSPICION, level));
  data.suspicion[player.id] = after;
  if (after > before) {
    player.game.log('${0} gained ${1} envy', (b) => b.player(player).number(after - before));
  } else if (after < before) {
    player.game.log('${0} lost ${1} envy', (b) => b.player(player).number(before - after));
  }
}

/** TR lost at the end of a generation for an envy level */
export {suspicionPenalty};

export function ownsSmugglersMarket(player: IPlayer): boolean {
  return player.game.board.spaces.some((space) => space.tile?.tileType === TileType.INDUSTRIAL_CENTER && space.player?.id === player.id);
}

/** Smuggler Network card: a tribute costs 4 less – a discount like the other discount cards (Jens 22 Oct 2026) */
export const NETWORK_BRIBE_DISCOUNT = 4;

export function bribeCost(player: IPlayer): number {
  const base = ownsSmugglersMarket(player) ? BRIBE_COST_WITH_MARKET : BRIBE_COST;
  return Math.max(0, base - (player.tableau.has(CardName.SMUGGLER_NETWORK) ? NETWORK_BRIBE_DISCOUNT : 0));
}

/** Friends of Esmar Tuek card */
export function lowerSuspicion(player: IPlayer, steps: number): void {
  const data = player.game.duneData?.smuggling;
  if (data !== undefined) {
    setEnvy(player, data, suspicionOf(data, player) - steps);
  }
}

/** Sardaukar Raid card: every opponent with envy 3 or more loses 1 TR */
export function raid(player: IPlayer): void {
  const data = player.game.duneData?.smuggling;
  if (data === undefined) {
    return;
  }
  for (const opponent of player.game.players) {
    if (opponent !== player && suspicionOf(data, opponent) >= 3) {
      opponent.decreaseTerraformRating(1, {log: true});
    }
  }
}

/** Every CHOAM move but the tribute: the envy of the great houses rises by 1 */
export function raiseEnvy(player: IPlayer, data: SmugglingData): void {
  setEnvy(player, data, suspicionOf(data, player) + 1);
}

/**
 * Guild: one trade at the rates of the exchange of this generation, moving spice (titanium for M€, up to 5 per deal)
 * included. The AI only moves spice (`onlySpice`).
 */
export function smuggleInput(player: IPlayer, data: SmugglingData, onlySpice: boolean): SelectTrade | undefined {
  if (envyFull(data, player)) {
    return undefined;
  }
  const {values, buyValues, spicePair} = currentPricing(data);
  const pricing = onlySpice ? {pairs: [spicePair]} : {values, buyValues, pairs: [spicePair]};
  const getOptions = onlySpice ? [Resource.MEGACREDITS] : ALL_RESOURCES;
  // What pays for at least one unit of some other resource
  const affords = (resource: Resource) => getOptions.some((get) => get !== resource &&
    player.stock.get(resource) >= (tradeRate(pricing, resource, get)?.give ?? Infinity));
  const resources = onlySpice ? [Resource.TITANIUM] : ALL_RESOURCES;
  if (!resources.some(affords)) {
    return undefined;
  }
  // Spice is always offered, with too little greyed out (client) and refused by the stock limit (SelectTrade):
  // otherwise moving spice seems to be missing (Jens, 19 Oct 2026)
  const give = resources
    .filter((resource) => affords(resource) || resource === Resource.TITANIUM)
    .map((resource) => ({resource, max: player.stock.get(resource)}));
  // Only the stock and the rate (and limit) of each pair limit the amounts, not the received side
  return new SelectTrade(SMUGGLE_TITLE, 'Trade', give, getOptions, NO_LIMIT, pricing)
    .andThen((trade) => {
      // The line first: the changes after it land on its right in the log (logActions.ts)
      player.game.log('${0} traded with the guild', (b) => b.player(player));
      player.stock.deduct(trade.give, trade.giveAmount, {log: true});
      player.stock.add(trade.get, trade.getAmount, {log: true});
      raiseEnvy(player, data);
      // Supply and demand: the trade moves the forecast of the next generation
      recordTrade(exchangeOf(data), trade.give, trade.giveAmount, trade.get, trade.getAmount);
      data.deals = {...data.deals, [player.id]: (data.deals?.[player.id] ?? 0) + 1};
      return undefined;
    });
}

/** Tribute for the AI: a plain choice in the Dune group of the action menu */
function bribeOption(player: IPlayer, data: SmugglingData): SelectOption | undefined {
  const cost = bribeCost(player);
  if (suspicionOf(data, player) < 1 || player.megaCredits < cost) {
    return undefined;
  }
  return new SelectOption(message(BRIBE_TITLE, (b) => b.number(cost)), 'Pay tribute').andThen(() => {
    logTribute(player);
    player.stock.deduct(Resource.MEGACREDITS, cost, {log: true});
    bribed(player, data);
    return undefined;
  });
}

/** Tribute in the CHOAM tab: paid like any cost, with the usual payment box (before → after) */
export function bribePayment(player: IPlayer, data: SmugglingData): SelectPayment | undefined {
  const cost = bribeCost(player);
  if (suspicionOf(data, player) < 1 || !player.canAfford(cost)) {
    return undefined;
  }
  return new SelectPayment(message(BRIBE_TITLE, (b) => b.number(cost)), cost, {}).andThen((payment) => {
    logTribute(player);
    payWithLog(player, payment);
    bribed(player, data);
    return undefined;
  });
}

function logTribute(player: IPlayer): void {
  player.game.log('${0} paid tribute to the great houses', (b) => b.player(player));
}

function bribed(player: IPlayer, data: SmugglingData): void {
  setEnvy(player, data, suspicionOf(data, player) - 1);
}

/** Moves of the Dune group of the action menu: only the AI pays tribute there (from 3 on, where it costs) */
export function smugglingActions(player: IPlayer, data: SmugglingData): Array<PlayerInput> {
  if (player.aiLevel === undefined || suspicionOf(data, player) < 3) {
    return [];
  }
  const bribe = bribeOption(player, data);
  return bribe === undefined ? [] : [bribe];
}

/** The AI only moves spice at the guild while it stays below a penalty */
export function aiGuildInput(player: IPlayer, data: SmugglingData): SelectTrade | undefined {
  if (suspicionOf(data, player) + 1 >= COSTLY_SUSPICION) {
    return undefined;
  }
  return smuggleInput(player, data, true);
}

/** End of generation: envy 3 and more costs TR (the houses vote against the player in the Landsraad), then back to 0 */
export function chargeSuspicion(game: IGame, data: SmugglingData): void {
  for (const player of game.players) {
    const penalty = suspicionPenalty(suspicionOf(data, player));
    if (penalty > 0) {
      game.log('The great houses vote against ${0} in the Landsraad', (b) => b.player(player));
      player.decreaseTerraformRating(penalty, {log: true});
      setEnvy(player, data, 0);
    }
  }
}

/**
 * New rates (the forecast comes true), then the prophecies, then a new privilege for `generation`. Since 25 Oct 2026
 * at the start of the action phase of the new generation, so all of it stands in its log (Jens); no CHOAM move
 * happens in between, the research phase only.
 */
export function moveExchange(game: IGame, data: SmugglingData, generation: number = game.generation): void {
  const exchange = exchangeOf(data);
  advanceExchange(exchange, game.rng);
  game.log('The guild sets new rates');
  fulfilOrders(game, prophecyOf(data), currentRates(exchange.sell), currentRates(exchange.buy));
  // The previewed privilege comes true, the one after it is drawn now
  data.privilege = renewPrivilege(game, generation, currentRates(exchange.sell), data.nextPrivilege);
  data.nextPrivilege = newPrivilege(generation + 1, game.rng);
}

/** Start of a generation: the exchange moves once. A game saved after the move at the old generation end (before
 *  25 Oct 2026) already has the privilege of this generation and does not move twice. */
export function openExchange(game: IGame, data: SmugglingData): void {
  const privilege = privilegeOf(game, data);
  if (privilege.generation >= game.generation) {
    // Generation 1: the start rates are the normal rates, nothing changes; the emperor's first wish is news though
    if (game.generation === 1) {
      announcePrivilege(game, privilege, currentSellRates(data));
    }
    return;
  }
  moveExchange(game, data, game.generation);
}

/** End of a generation: the privilege nobody took lapses */
export function closeExchange(game: IGame, data: SmugglingData): void {
  lapsePrivilege(game, data.privilege);
}

export function smugglingModel(game: IGame, data: SmugglingData, viewer?: IPlayer): SmugglingModel {
  const exchange = exchangeOf(data);
  const forecast = forecastOf(exchange);
  return {
    suspicion: game.players.map((player) => ({color: player.color, level: suspicionOf(data, player), bribeCost: bribeCost(player)})),
    exchange: {
      sell: {normal: {...NORMAL_SELL}, history: exchange.sell, next: forecast?.sell},
      buy: {normal: {...NORMAL_BUY}, history: exchange.buy, next: forecast?.buy},
    },
    privilege: privilegeModel(game, privilegeOf(game, data), currentRates(exchange.sell)),
    // The next privilege pays by the forecast, which supply and demand can still move this generation
    nextPrivilege: privilegeModel(game, nextPrivilegeOf(game, data), forecast?.sell ?? currentRates(exchange.sell)),
    orders: prophecyModel(prophecyOf(data), viewer),
  };
}
