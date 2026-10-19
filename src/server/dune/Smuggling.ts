import {IGame} from '../IGame';
import {BRIBE_TITLE, SMUGGLE_TITLE} from '../../common/dune/duneActionTitles';
import {IPlayer} from '../IPlayer';
import {PlayerId} from '../../common/Types';
import {ALL_RESOURCES, Resource} from '../../common/Resource';
import {TileType} from '../../common/TileType';
import {SelectOption} from '../inputs/SelectOption';
import {SelectTrade} from '../inputs/SelectTrade';
import {SelectPayment} from '../inputs/SelectPayment';
import {OrOptions} from '../inputs/OrOptions';
import {tradeRate} from '../../common/inputs/tradeRate';
import {BAZAAR_GOOD_VALUE} from '../../common/dune/bazaarWares';
import {PlayerInput} from '../PlayerInput';
import {message} from '../logs/MessageBuilder';
import {COSTLY_SUSPICION, MAX_SUSPICION, SmugglingModel, suspicionPenalty} from '../../common/dune/DuneModel';
import {CardName} from '../../common/cards/CardName';

// Module E – Smuggling & suspicion (claude/dune-erweiterung-konzept.md). Trading past the Empire pays more, but every
// deal makes you more suspicious, and high suspicion costs TR (Landsraad influence). All actions any number of times:
// - Move spice: up to 5 titanium, 5 M€ each instead of its worth of 3. Suspicion +1.
// - Black market: any resource for another at double its worth (value table), any amount in one action. Suspicion +1.
// - Bribe: 10 M€ (owner of the Smugglers' market tile – Industrial Center – 7), suspicion −1.
// Checked only at the end of the generation: 0 and 1 free, level 2 −1 TR, 3 −2, 4 −3; whoever pays drops back to 0.
// Level 4 (top) blocks smuggling. (Jens, 19 Oct 2026)

export type SmugglingData = {
  suspicion: Record<PlayerId, number>,
};

export {MAX_SUSPICION};
export const SPICE_PRICE = 5;
export const MAX_SPICE_PER_DEAL = 5;
export const BRIBE_COST = 10;
export const BRIBE_COST_WITH_MARKET = 7;
/** Black market: what is given is worth this many times what is received */
export const BLACK_MARKET_FACTOR = 2;
/** No upper limit on what smuggling pays out (the stock limits it) */
const NO_LIMIT = 9999;
/** Moving spice: its own rate, better than the black market, and at most 5 spice per deal */
const SPICE_PAIR = {give: Resource.TITANIUM, get: Resource.MEGACREDITS, rate: {give: 1, get: SPICE_PRICE}, maxGive: MAX_SPICE_PER_DEAL};
/** Worth of one unit on the black market: the value table of the Dune expansion (M€ 1, steel 2, titanium 3 …) */
export const BLACK_MARKET_VALUES: Record<Resource, number> = {
  megacredits: 1,
  steel: BAZAAR_GOOD_VALUE.steel,
  titanium: BAZAAR_GOOD_VALUE.titanium,
  plants: BAZAAR_GOOD_VALUE.plants,
  energy: BAZAAR_GOOD_VALUE.energy,
  heat: BAZAAR_GOOD_VALUE.heat,
};

export function initializeSmuggling(): SmugglingData {
  return {suspicion: {}};
}

/** Level on the track; games from before the track ended at 4 may hold a 5, which counts as the top (4) */
export function suspicionOf(data: SmugglingData, player: IPlayer): number {
  return Math.min(MAX_SUSPICION, data.suspicion[player.id] ?? 0);
}

/** TR lost at the end of a generation for a suspicion level */
export {suspicionPenalty};

export function ownsSmugglersMarket(player: IPlayer): boolean {
  return player.game.board.spaces.some((space) => space.tile?.tileType === TileType.INDUSTRIAL_CENTER && space.player?.id === player.id);
}

/** Smuggler Network card: a bribe costs 6 */
export const BRIBE_COST_WITH_NETWORK = 6;

export function bribeCost(player: IPlayer): number {
  if (player.tableau.has(CardName.SMUGGLER_NETWORK)) {
    return BRIBE_COST_WITH_NETWORK;
  }
  return ownsSmugglersMarket(player) ? BRIBE_COST_WITH_MARKET : BRIBE_COST;
}

/** Friends of Esmar Tuek card */
export function lowerSuspicion(player: IPlayer, steps: number): void {
  const data = player.game.duneData?.smuggling;
  if (data !== undefined) {
    data.suspicion[player.id] = Math.max(0, suspicionOf(data, player) - steps);
  }
}

/** Sardaukar Raid card: every opponent with suspicion 3 or more loses 1 TR */
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

function raise(player: IPlayer, data: SmugglingData): void {
  data.suspicion[player.id] = Math.min(MAX_SUSPICION, suspicionOf(data, player) + 1);
}

/**
 * Smuggling in one trade, its own action tab (Jens, 19 Oct 2026): moving spice (1 titanium for 5 M€, up to 5 per deal)
 * and the black market (any resource for another at double its worth, value table: 6 M€ for 1 spice …).
 * The AI only moves spice (`onlySpice`).
 */
function smuggleInput(player: IPlayer, data: SmugglingData, onlySpice: boolean): SelectTrade | undefined {
  if (suspicionOf(data, player) >= MAX_SUSPICION) {
    return undefined;
  }
  const pricing = onlySpice ?
    {pairs: [SPICE_PAIR]} :
    {values: BLACK_MARKET_VALUES, factor: BLACK_MARKET_FACTOR, pairs: [SPICE_PAIR]};
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
  return new SelectTrade(SMUGGLE_TITLE, 'Smuggle', give, getOptions, NO_LIMIT, pricing)
    .andThen((trade) => {
      player.stock.deduct(trade.give, trade.giveAmount, {log: true});
      player.stock.add(trade.get, trade.getAmount, {log: true});
      raise(player, data);
      if (trade.give === Resource.TITANIUM && trade.get === Resource.MEGACREDITS) {
        player.game.log('${0} smuggled spice past the Empire', (b) => b.player(player));
      } else {
        player.game.log('${0} traded on the black market', (b) => b.player(player));
      }
      return undefined;
    });
}

/** Bribe for the AI: a plain choice in the Dune group of the action menu */
function bribeOption(player: IPlayer, data: SmugglingData): SelectOption | undefined {
  const cost = bribeCost(player);
  if (suspicionOf(data, player) < 1 || player.megaCredits < cost) {
    return undefined;
  }
  return new SelectOption(message(BRIBE_TITLE, (b) => b.number(cost)), 'Bribe').andThen(() => {
    player.stock.deduct(Resource.MEGACREDITS, cost, {log: true});
    bribed(player, data);
    return undefined;
  });
}

/** Bribe in the smuggling tab: paid like any cost, with the usual payment box (before → after) */
function bribePayment(player: IPlayer, data: SmugglingData): SelectPayment | undefined {
  const cost = bribeCost(player);
  if (suspicionOf(data, player) < 1 || !player.canAfford(cost)) {
    return undefined;
  }
  return new SelectPayment(message(BRIBE_TITLE, (b) => b.number(cost)), cost, {}).andThen((payment) => {
    player.pay(payment);
    bribed(player, data);
    return undefined;
  });
}

function bribed(player: IPlayer, data: SmugglingData): void {
  data.suspicion[player.id] = suspicionOf(data, player) - 1;
  player.game.log('${0} bribed the officials', (b) => b.player(player));
}

/** Smuggling actions of the Dune group of the action menu: only the AI bribes there (from 3 on) */
export function smugglingActions(player: IPlayer, data: SmugglingData): Array<PlayerInput> {
  if (player.aiLevel === undefined || suspicionOf(data, player) < 3) {
    return [];
  }
  const bribe = bribeOption(player, data);
  return bribe === undefined ? [] : [bribe];
}

/**
 * Smuggling with its own tab in the action menu. A player gets one tab with the trade and the bribe (Jens, 19 Oct
 * 2026); at the top of the track (4) only the bribe. The AI only moves spice while it stays below a penalty.
 */
export function smugglingTabActions(player: IPlayer, data: SmugglingData): Array<PlayerInput> {
  if (player.aiLevel !== undefined) {
    if (suspicionOf(data, player) + 1 >= COSTLY_SUSPICION) {
      return [];
    }
    const input = smuggleInput(player, data, true);
    return input === undefined ? [] : [input];
  }
  const choices = [smuggleInput(player, data, false), bribePayment(player, data)]
    .filter((input): input is SelectTrade | SelectPayment => input !== undefined);
  return choices.length === 0 ? [] : [new OrOptions(...choices).setTitle(SMUGGLE_TITLE)];
}

/** End of generation: suspicion 2 and more costs TR (Landsraad influence), then the marker drops back to 0 */
export function chargeSuspicion(game: IGame, data: SmugglingData): void {
  for (const player of game.players) {
    const penalty = suspicionPenalty(suspicionOf(data, player));
    if (penalty > 0) {
      game.log('The Empire suspects ${0}: −${1} TR', (b) => b.player(player).number(penalty));
      player.decreaseTerraformRating(penalty, {log: true});
      data.suspicion[player.id] = 0;
    }
  }
}

export function smugglingModel(game: IGame, data: SmugglingData): SmugglingModel {
  return {suspicion: game.players.map((player) => ({color: player.color, level: suspicionOf(data, player)}))};
}
