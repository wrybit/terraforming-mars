import {IGame} from '../IGame';
import {BLACK_MARKET_TITLE, BRIBE_TITLE, SMUGGLE_SPICE_TITLE} from '../../common/dune/duneActionTitles';
import {IPlayer} from '../IPlayer';
import {PlayerId} from '../../common/Types';
import {ALL_RESOURCES, Resource} from '../../common/Resource';
import {TileType} from '../../common/TileType';
import {OrOptions} from '../inputs/OrOptions';
import {SelectOption} from '../inputs/SelectOption';
import {SelectAmount} from '../inputs/SelectAmount';
import {PlayerInput} from '../PlayerInput';
import {message} from '../logs/MessageBuilder';
import {MAX_SUSPICION, SmugglingModel, suspicionPenalty} from '../../common/dune/DuneModel';
import {RESOURCE_LABEL} from './resourceLabels';
import {CardName} from '../../common/cards/CardName';

// Module E – Smuggling & suspicion (claude/dune-erweiterung-konzept.md). Trading past the Empire pays more, but every
// deal makes you more suspicious, and high suspicion costs TR (Landsraad influence). All actions any number of times:
// - Move spice: up to 5 titanium, 5 M€ each instead of its worth of 3. Suspicion +1.
// - Black market: any 2 resources for 1 of another kind, any amount in one action. Suspicion +1.
// - Bribe: 10 M€ (owner of the Smugglers' market tile – Industrial Center – 7), suspicion −1.
// Checked only at the end of the generation: level 3 −1 TR, 4 −2, 5 −3. The marker stays; level 5 blocks smuggling.

export type SmugglingData = {
  suspicion: Record<PlayerId, number>,
};

export {MAX_SUSPICION};
export const SPICE_PRICE = 5;
export const MAX_SPICE_PER_DEAL = 5;
export const BRIBE_COST = 10;
export const BRIBE_COST_WITH_MARKET = 7;

export function initializeSmuggling(): SmugglingData {
  return {suspicion: {}};
}

export function suspicionOf(data: SmugglingData, player: IPlayer): number {
  return data.suspicion[player.id] ?? 0;
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

function moveSpiceInput(player: IPlayer, data: SmugglingData, onlyMost: boolean): OrOptions | undefined {
  const most = Math.min(MAX_SPICE_PER_DEAL, player.titanium);
  if (suspicionOf(data, player) >= MAX_SUSPICION || most < 1) {
    return undefined;
  }
  const options: Array<SelectOption> = [];
  for (let amount = onlyMost ? most : 1; amount <= most; amount++) {
    options.push(new SelectOption(message('Move ${0} titanium for ${1} M€', (b) => b.number(amount).number(amount * SPICE_PRICE)), 'Smuggle')
      .andThen(() => {
        player.stock.deduct(Resource.TITANIUM, amount, {log: true});
        player.stock.add(Resource.MEGACREDITS, amount * SPICE_PRICE, {log: true});
        raise(player, data);
        player.game.log('${0} smuggled spice past the Empire', (b) => b.player(player));
        return undefined;
      }));
  }
  return new OrOptions(...options).setTitle(SMUGGLE_SPICE_TITLE);
}

function blackMarketInput(player: IPlayer, data: SmugglingData): OrOptions | undefined {
  if (suspicionOf(data, player) >= MAX_SUSPICION) {
    return undefined;
  }
  const giveOptions: Array<OrOptions> = [];
  for (const give of ALL_RESOURCES) {
    const pairs = Math.floor(player.stock.get(give) / 2);
    if (pairs < 1) {
      continue;
    }
    const getOptions = ALL_RESOURCES.filter((get) => get !== give).map((get) =>
      new SelectAmount(message('Get ${0} (2 ${1} each)', (b) => b.string(RESOURCE_LABEL[get]).string(RESOURCE_LABEL[give])), 'Trade', 1, pairs, true)
        .andThen((amount) => {
          player.stock.deduct(give, amount * 2, {log: true});
          player.stock.add(get, amount, {log: true});
          raise(player, data);
          player.game.log('${0} traded on the black market', (b) => b.player(player));
          return undefined;
        }));
    giveOptions.push(new OrOptions(...getOptions).setTitle(message('Give ${0}', (b) => b.string(RESOURCE_LABEL[give]))));
  }
  return giveOptions.length === 0 ? undefined : new OrOptions(...giveOptions).setTitle(BLACK_MARKET_TITLE);
}

function bribeInput(player: IPlayer, data: SmugglingData): SelectOption | undefined {
  const cost = bribeCost(player);
  if (suspicionOf(data, player) < 1 || player.megaCredits < cost) {
    return undefined;
  }
  return new SelectOption(message(BRIBE_TITLE, (b) => b.number(cost)), 'Bribe').andThen(() => {
    player.stock.deduct(Resource.MEGACREDITS, cost, {log: true});
    data.suspicion[player.id] = suspicionOf(data, player) - 1;
    player.game.log('${0} bribed the officials', (b) => b.player(player));
    return undefined;
  });
}

/** Smuggling actions of the action menu. The AI only smuggles while it stays below a penalty, and bribes from 3 on. */
export function smugglingActions(player: IPlayer, data: SmugglingData): Array<PlayerInput> {
  const isAi = player.aiLevel !== undefined;
  const level = suspicionOf(data, player);
  const actions: Array<PlayerInput | undefined> = isAi ?
    [level <= 1 ? moveSpiceInput(player, data, true) : undefined, level >= 3 ? bribeInput(player, data) : undefined] :
    [moveSpiceInput(player, data, false), blackMarketInput(player, data), bribeInput(player, data)];
  return actions.filter((input): input is PlayerInput => input !== undefined);
}

/** End of generation: suspicion 3 and more costs TR; the marker stays */
export function chargeSuspicion(game: IGame, data: SmugglingData): void {
  for (const player of game.players) {
    const penalty = suspicionPenalty(suspicionOf(data, player));
    if (penalty > 0) {
      game.log('The Empire suspects ${0}: −${1} TR', (b) => b.player(player).number(penalty));
      player.decreaseTerraformRating(penalty, {log: true});
    }
  }
}

export function smugglingModel(game: IGame, data: SmugglingData): SmugglingModel {
  return {suspicion: game.players.map((player) => ({color: player.color, level: suspicionOf(data, player)}))};
}
