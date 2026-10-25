import {IGame} from '../IGame';
import {JOIN_KANLY_TITLE, KANLY_SEND_BUTTON, KANLY_SEND_TITLE, OPEN_KANLY_TITLE, RECRUIT_TITLE} from '../../common/dune/duneActionTitles';
import {battleWinner, isKanlyTargetTile, OPEN_KANLY_COST} from '../../common/dune/kanlyBattle';
import {IPlayer} from '../IPlayer';
import {Space} from '../boards/Space';
import {PlayerId, SpaceId} from '../../common/Types';
import {Resource} from '../../common/Resource';
import {OrOptions} from '../inputs/OrOptions';
import {SelectOption} from '../inputs/SelectOption';
import {SelectSpace} from '../inputs/SelectSpace';
import {SelectAmount} from '../inputs/SelectAmount';
import {PlayerInput} from '../PlayerInput';
import {message} from '../logs/MessageBuilder';
import {KanlyModel} from '../../common/dune/DuneModel';
import {Arrakis61Board} from '../boards/Arrakis61Board';
import {CardName} from '../../common/cards/CardName';
import {RESOURCE_LABEL} from './resourceLabels';

// Module F – Kanly, the war field (claude/dune-erweiterung-konzept.md). Battles are dear and rare: at most one per
// generation, and the one who opens it picks the target – speed beats the biggest army.
// 1. Open (action): a marker on another player's greenery, city or special tile (not a spice field, not the worm
//    domain) with at least 1 Sardaukar from the own garrison.
// 2. Join (action, any number of times): everybody – the owner too – sends Sardaukar from the garrison.
// 3. End of generation: the most Sardaukar take the tile over (no new placement bonus); on a tie the owner keeps it.
//    All Sardaukar in the field are spent.
// Recruiting is a standard action: per Sardaukar one kind of payment, at most 2 per action.

export type KanlyData = {
  /** Sardaukar waiting in each player's garrison */
  garrison: Record<PlayerId, number>,
  battle?: {
    spaceId: SpaceId,
    opener: PlayerId,
    troops: Record<PlayerId, number>,
  },
  /** A battle was already opened this generation */
  foughtThisGeneration: boolean,
};

/** Price of one Sardaukar – the player pays one of these */
export const SARDAUKAR_PRICES: ReadonlyArray<[Resource, number]> = [
  [Resource.MEGACREDITS, 12],
  [Resource.TITANIUM, 4],
  [Resource.STEEL, 6],
  [Resource.HEAT, 5],
  [Resource.ENERGY, 6],
];

export const MAX_RECRUITS_PER_ACTION = 2;

export {OPEN_KANLY_COST};

export function initializeKanly(): KanlyData {
  return {garrison: {}, foughtThisGeneration: false};
}

export function garrisonOf(data: KanlyData, player: IPlayer): number {
  return data.garrison[player.id] ?? 0;
}


/** Spaces a battle may be opened on: a tile of another player that is a greenery, a city or a special tile */
export function battleTargets(game: IGame, attacker: IPlayer): Array<Space> {
  return game.board.spaces.filter((space) => {
    const tile = space.tile;
    if (tile === undefined || space.player === undefined || space.player.id === attacker.id) {
      return false;
    }
    return isKanlyTargetTile(tile.tileType);
  });
}

function recruitInput(player: IPlayer, data: KanlyData): OrOptions | undefined {
  const options: Array<SelectOption> = [];
  for (const [resource, price] of SARDAUKAR_PRICES) {
    for (let count = 1; count <= MAX_RECRUITS_PER_ACTION; count++) {
      const cost = price * count;
      if (player.stock.get(resource) < cost) {
        continue;
      }
      options.push(new SelectOption(message('${0} Sardaukar for ${1} ${2}', (b) => b.number(count).number(cost).string(RESOURCE_LABEL[resource])), 'Recruit')
        .andThen(() => {
          player.game.log('${0} recruited ${1} Sardaukar', (b) => b.player(player).number(count));
          player.stock.deduct(resource, cost, {log: true});
          changeGarrison(player, data, count);
          return undefined;
        }));
    }
  }
  return options.length === 0 ? undefined : new OrOptions(...options).setTitle(RECRUIT_TITLE);
}

/**
 * Sardaukar straight into the garrison (Sardaukar Mercenaries card, recruiting standard project): no line of its own,
 * the Sardaukar land on the right of the card or standard project row in the log (Jens 25 Oct 2026)
 */
export function addSardaukar(player: IPlayer, count: number): void {
  const data = player.game.duneData?.kanly;
  if (data !== undefined) {
    changeGarrison(player, data, count);
  }
}

/** Sardaukar into or out of the garrison, as a log line of its own: the icon on the right of the move (logActions.ts) */
function changeGarrison(player: IPlayer, data: KanlyData, change: number): void {
  data.garrison[player.id] = garrisonOf(data, player) + change;
  if (change > 0) {
    player.game.log('${0} gained ${1} Sardaukar', (b) => b.player(player).number(change));
  } else if (change < 0) {
    player.game.log('${0} lost ${1} Sardaukar', (b) => b.player(player).number(-change));
  }
}

function sendTroops(player: IPlayer, data: KanlyData, amount: number): void {
  const battle = data.battle;
  if (battle === undefined) {
    return;
  }
  changeGarrison(player, data, -amount);
  battle.troops[player.id] = (battle.troops[player.id] ?? 0) + amount;
}

function openInput(player: IPlayer, data: KanlyData): PlayerInput | undefined {
  const garrison = garrisonOf(data, player);
  if (data.battle !== undefined || data.foughtThisGeneration || garrison < 1 || player.megaCredits < OPEN_KANLY_COST) {
    return undefined;
  }
  const targets = battleTargets(player.game, player);
  if (targets.length === 0) {
    return undefined;
  }
  return new SelectSpace(OPEN_KANLY_TITLE, targets).andThen((space) => {
    player.game.log('${0} declares Kanly on ${1}', (b) => b.player(player).space(space));
    player.stock.deduct(Resource.MEGACREDITS, OPEN_KANLY_COST, {log: true});
    data.battle = {spaceId: space.id, opener: player.id, troops: {}};
    data.foughtThisGeneration = true;
    if (player.game.board instanceof Arrakis61Board) {
      player.game.board.warFieldSpaceId = space.id;
    }
    // Shield Generator card: 1 Sardaukar defends the owner's tile for free
    const owner = space.player;
    const shieldOwner = owner !== undefined && owner.tableau.has(CardName.SHIELD_GENERATOR) ? owner : undefined;
    const battle = data.battle;
    if (shieldOwner !== undefined) {
      battle.troops[shieldOwner.id] = (battle.troops[shieldOwner.id] ?? 0) + 1;
    }
    return new SelectAmount(KANLY_SEND_TITLE, KANLY_SEND_BUTTON, 1, garrison, true).andThen((amount) => {
      sendTroops(player, data, amount);
      // After the troops: a text line of its own would cut them off the row of the declaration in the log
      if (shieldOwner !== undefined) {
        player.game.log('The shield generator of ${0} holds 1 Sardaukar in the war field', (b) => b.player(shieldOwner));
      }
      return undefined;
    });
  });
}

function joinInput(player: IPlayer, data: KanlyData): PlayerInput | undefined {
  const garrison = garrisonOf(data, player);
  if (data.battle === undefined || garrison < 1) {
    return undefined;
  }
  return new SelectAmount(JOIN_KANLY_TITLE, KANLY_SEND_BUTTON, 1, garrison, true).andThen((amount) => {
    player.game.log('${0} sent ${1} Sardaukar to the war field', (b) => b.player(player).number(amount));
    sendTroops(player, data, amount);
    return undefined;
  });
}

/** Kanly actions of the action menu */
export function kanlyActions(player: IPlayer, data: KanlyData): Array<PlayerInput> {
  return [recruitInput(player, data), openInput(player, data), joinInput(player, data)]
    .filter((input): input is PlayerInput => input !== undefined);
}

/** End of generation: the majority takes the tile over, a tie leaves it with the owner; all troops are spent */
export function resolveBattle(game: IGame, data: KanlyData): void {
  data.foughtThisGeneration = false;
  const battle = data.battle;
  if (battle === undefined) {
    return;
  }
  data.battle = undefined;
  const space = game.board.getSpaceOrThrow(battle.spaceId);
  const owner = space.player;
  if (owner === undefined || space.tile === undefined) {
    return;
  }
  const forces = (Object.entries(battle.troops) as Array<[PlayerId, number]>).map(([key, sardaukar]) => ({key, sardaukar}));
  const winnerId = battleWinner(owner.id, forces);
  const winner = winnerId === undefined ? undefined : game.getPlayerById(winnerId);
  if (winner === undefined) {
    game.log('${0} holds ${1} in the Kanly', (b) => b.player(owner).space(space));
    return;
  }
  space.player = winner;
  game.log('${0} takes ${1} from ${2} in the Kanly', (b) => b.player(winner).space(space).player(owner));
}

export function kanlyModel(game: IGame, data: KanlyData): KanlyModel {
  const battle = data.battle;
  return {
    garrisons: game.players.map((player) => ({color: player.color, sardaukar: garrisonOf(data, player)})),
    battle: battle === undefined ? undefined : {
      spaceId: battle.spaceId,
      owner: game.board.getSpaceOrThrow(battle.spaceId).player?.color,
      opener: game.getPlayerById(battle.opener).color,
      troops: game.players.map((player) => ({color: player.color, sardaukar: battle.troops[player.id] ?? 0})).filter((entry) => entry.sardaukar > 0),
    },
    foughtThisGeneration: data.foughtThisGeneration,
  };
}
