import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {Space} from '../boards/Space';
import {Board} from '../boards/Board';
import {SpaceId} from '../../common/Types';
import {Resource} from '../../common/Resource';
import {TileType} from '../../common/TileType';
import {OrOptions} from '../inputs/OrOptions';
import {SelectOption} from '../inputs/SelectOption';
import {message} from '../logs/MessageBuilder';
import {ARRAKIS_ZONES, BEHIND_WORM_BORDER} from '../../common/dune/arrakisTerrain';
import {WormModel} from '../../common/dune/DuneModel';
import {BAZAAR_GOOD_VALUE} from '../../common/dune/bazaarWares';
import {arrakisCoordinate} from '../../common/dune/arrakisCoordinates';
import {CardName} from '../../common/cards/CardName';

// Module C – Shai-Hulud (claude/dune-erweiterung-konzept.md): a worm marker wanders over Arrakis. At the end of
// every generation a die gives the direction, the weakest player (least TR) chooses 1–3 spaces, and every space the
// worm crosses – the last one included – takes effect. Rock, the worm border around the polar sink and the edge of
// the board stop it in front of the space. Nothing may be placed on the space under the worm.

export type WormData = {
  spaceId: SpaceId,
  /** Die of the running or last move (1 top right … 6 top left, clockwise) */
  roll?: number,
  /** Spaces crossed by the last move */
  path: Array<SpaceId>,
  /** Player choosing the distance right now; set while the game waits (reload resumes) */
  chooser?: string,
  /** Thumper card: this player chooses the distance this generation */
  thumper?: string,
};

/** The concept starts on E5, the middle of the board, but E5 (polar sink) lies behind the worm border: the worm
 *  starts on the next desert space west of it, E4 (Wind pass). */
export const WORM_START: SpaceId = '32' as SpaceId;

export const WORM_TITLE = 'Shai-Hulud: how far does the worm move?';

/** Clockwise index of getAdjacentSpacesClockwise (0 top left … 5 left) for a die roll (1 top right … 6 top left) */
export function directionIndex(roll: number): number {
  return roll % 6;
}

/** The greener Arrakis, the weaker the worm: from 8 % vegetation at most 2 spaces, at full vegetation 1 */
export function maxWormDistance(game: IGame): number {
  const vegetation = game.getOxygenLevel();
  if (vegetation >= game.max.oxygen) {
    return 1;
  }
  return vegetation >= 8 ? 2 : 3;
}

/** The weakest player chooses the distance: least TR, on a tie the later one in turn order */
export function wormChooser(game: IGame): IPlayer {
  const order = game.playersInGenerationOrder;
  return order.reduce((weakest, player) => (player.terraformRating <= weakest.terraformRating ? player : weakest), order[0]);
}

function stopsWorm(space: Space | undefined): boolean {
  if (space === undefined) {
    return true;
  }
  const zone = ARRAKIS_ZONES[space.id];
  return zone === 'rock' || zone === 'city' || BEHIND_WORM_BORDER.includes(space.id);
}

/** Spaces the worm would cross with `distance`, in order (fewer when something stops it) */
export function wormPath(board: Board, from: SpaceId, roll: number, distance: number): Array<Space> {
  const path: Array<Space> = [];
  let current = board.getSpaceOrThrow(from);
  for (let step = 0; step < distance; step++) {
    const next = board.getAdjacentSpacesClockwise(current)[directionIndex(roll)];
    if (next === undefined || stopsWorm(next)) {
      break;
    }
    path.push(next);
    current = next;
    // The worm domain (Natural Preserve tile) holds the worm
    if (next.tile?.tileType === TileType.NATURAL_PRESERVE) {
      break;
    }
  }
  return path;
}

// Order in which a player who cannot pay a levy gives other resources (cheapest units first)
const FALLBACK: ReadonlyArray<[Resource, number]> = [
  [Resource.HEAT, BAZAAR_GOOD_VALUE.heat],
  [Resource.ENERGY, BAZAAR_GOOD_VALUE.energy],
  [Resource.PLANTS, BAZAAR_GOOD_VALUE.plants],
  [Resource.MEGACREDITS, 1],
  [Resource.STEEL, BAZAAR_GOOD_VALUE.steel],
  [Resource.TITANIUM, BAZAAR_GOOD_VALUE.titanium],
];

/** A levy of 3 units; whoever cannot pay it gives resources worth 4 instead (value table of module A), as far as they go */
export function payLevy(player: IPlayer, resource: Resource): void {
  const levy = 3;
  if (player.stock.get(resource) >= levy) {
    player.stock.deduct(resource, levy, {log: true});
    return;
  }
  let owed = 4;
  for (const [fallback, value] of FALLBACK) {
    const units = Math.min(player.stock.get(fallback), Math.ceil(owed / value));
    if (units > 0) {
      player.stock.deduct(fallback, units, {log: true});
      owed -= units * value;
    }
    if (owed <= 0) {
      break;
    }
  }
}

/** Effect of one crossed space */
export function crossSpace(game: IGame, space: Space): void {
  // Worm Rider card: 2 titanium for every crossed space next to one of the owner's tiles
  for (const player of game.players) {
    if (player.tableau.has(CardName.WORM_RIDER) &&
      game.board.getAdjacentSpaces(space).some((adjacent) => adjacent.player?.id === player.id && Board.hasRealTile(adjacent))) {
      player.stock.add(Resource.TITANIUM, 2, {log: true});
    }
  }
  const tile = space.tile;
  if (tile === undefined) {
    return;
  }
  const owner = space.player;
  if (tile.tileType === TileType.OCEAN) {
    // Spice blow: +1 spice for each adjacent tile of a player, at most 6 in total
    let given = 0;
    for (const adjacent of game.board.getAdjacentSpaces(space)) {
      if (given >= 6) {
        break;
      }
      if (adjacent.player !== undefined && Board.hasRealTile(adjacent)) {
        adjacent.player.stock.add(Resource.TITANIUM, 1, {log: true});
        given++;
      }
    }
    game.log('Spice blow at ${0}', (b) => b.space(space));
    return;
  }
  if (owner === undefined) {
    return;
  }
  if (Board.isCitySpace(space)) {
    game.log('Worm riders of ${0} ride Shai-Hulud', (b) => b.player(owner));
    owner.stock.add(Resource.TITANIUM, 1, {log: true});
    owner.stock.add(Resource.HEAT, 2, {log: true});
  } else if (Board.isGreenerySpace(space)) {
    // Dune Stabiliser card: the worm spares the owner's greeneries
    if (owner.tableau.has(CardName.DUNE_STABILISER)) {
      return;
    }
    game.log('Shai-Hulud tramples a greenery of ${0}', (b) => b.player(owner));
    payLevy(owner, Resource.PLANTS);
  } else if (tile.tileType === TileType.NATURAL_PRESERVE) {
    owner.increaseTerraformRating(1, {log: true});
  } else {
    game.log('Shai-Hulud damages a special tile of ${0}', (b) => b.player(owner));
    payLevy(owner, Resource.MEGACREDITS);
  }
}

export function moveWorm(game: IGame, worm: WormData, distance: number): void {
  const roll = worm.roll ?? 1;
  const path = wormPath(game.board, worm.spaceId, roll, distance);
  game.log('Shai-Hulud moves ${0} space(s)', (b) => b.number(path.length));
  for (const space of path) {
    crossSpace(game, space);
  }
  worm.path = path.map((space) => space.id);
  if (path.length > 0) {
    worm.spaceId = path[path.length - 1].id;
  }
  worm.chooser = undefined;
  worm.thumper = undefined;
}

export function distanceInput(game: IGame, worm: WormData): OrOptions {
  const max = maxWormDistance(game);
  const options: Array<SelectOption> = [];
  for (let distance = 1; distance <= max; distance++) {
    // Label with the space the worm ends on (it may stop earlier), so the chooser sees where it goes
    const path = wormPath(game.board, worm.spaceId, worm.roll ?? 1, distance);
    const end = path.length === 0 ? worm.spaceId : path[path.length - 1].id;
    options.push(new SelectOption(message('${0} space(s): to ${1}', (b) => b.number(distance).rawString(arrakisCoordinate(end))), 'Move')
      .andThen(() => {
        moveWorm(game, worm, distance);
        return undefined;
      }));
  }
  // Plain title: the AI recognises the choice by it (ai/duneChoices.ts); the die shows on the Dune tab
  return new OrOptions(...options).setTitle(WORM_TITLE);
}

export function wormModel(game: IGame, worm: WormData): WormModel {
  return {
    spaceId: worm.spaceId,
    roll: worm.roll,
    path: worm.path,
    chooser: worm.chooser === undefined ? undefined : game.getPlayerById(worm.chooser as IPlayer['id']).color,
  };
}
