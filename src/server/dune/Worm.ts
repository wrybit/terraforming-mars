import {IGame} from '../IGame';
import {WORM_TITLE} from '../../common/dune/duneActionTitles';
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
import {PendingLevy, takeLevy} from './WormLevy';
import {arrakisCoordinate} from '../../common/dune/arrakisCoordinates';
import {CardName} from '../../common/cards/CardName';

// Module C – Shai-Hulud (claude/dune-erweiterung-konzept.md): a worm marker wanders over Arrakis. At the end of
// every generation a die gives the direction, the weakest player (least TR) chooses 1–3 spaces, and every space the
// worm crosses – the last one included – takes effect. Rock, the worm border around the polar sink and the edge of
// the board stop it in front of the space. If the rolled direction is blocked right away, the worm turns clockwise to
// the next free direction (otherwise it would stay put most generations). Nothing may be placed on the space under the worm.

export type WormData = {
  spaceId: SpaceId,
  /** Die of the running or last move (1 top right … 6 top left, clockwise) */
  roll?: number,
  /** Heading of that move after turning away from blocked spaces (index of getAdjacentSpacesClockwise) */
  direction?: number,
  /** Spaces crossed by the last move */
  path: Array<SpaceId>,
  /** Player choosing the distance right now; set while the game waits (reload resumes) */
  chooser?: string,
  /** Thumper card: this player chooses the distance this generation */
  thumper?: string,
  /** Levies of the last move that players still pay with resources of their choice (WormLevy.ts) */
  levies?: Array<PendingLevy>,
  /** Greeneries placed by Dune Stabiliser: the worm spares them */
  spared?: Array<SpaceId>,
  /** Where the recorded trail begins: the start space, or the space of the first move recorded (older games) */
  trailStart?: SpaceId,
  /** Every move so far, oldest first: the generation it ended and the spaces crossed (empty when blocked) */
  trail?: Array<{generation: number, path: Array<SpaceId>}>,
};

/** Start in the deep desert south of the polar sink: G3 (G4, as wished, lies behind the worm border like E5). */
export const WORM_START: SpaceId = '48' as SpaceId;

export {WORM_TITLE};

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

/** Heading for a die roll: the rolled direction, or the next free one clockwise when it is blocked; undefined when boxed in */
export function wormDirection(board: Board, from: SpaceId, roll: number): number | undefined {
  const neighbours = board.getAdjacentSpacesClockwise(board.getSpaceOrThrow(from));
  for (let turn = 0; turn < neighbours.length; turn++) {
    const direction = (directionIndex(roll) + turn) % neighbours.length;
    if (!stopsWorm(neighbours[direction])) {
      return direction;
    }
  }
  return undefined;
}

/** Spaces the worm crosses heading `direction` for `distance` (fewer when something stops it) */
export function wormPath(board: Board, from: SpaceId, direction: number | undefined, distance: number): Array<Space> {
  const path: Array<Space> = [];
  if (direction === undefined) {
    return path;
  }
  let current = board.getSpaceOrThrow(from);
  for (let step = 0; step < distance; step++) {
    const next = board.getAdjacentSpacesClockwise(current)[direction];
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

/** Effect of one crossed space; returns the levy its owner still has to pay with resources of their choice */
export function crossSpace(game: IGame, space: Space, spared: ReadonlyArray<SpaceId> = []): PendingLevy | undefined {
  // Worm Rider card: 2 titanium for every crossed space next to one of the owner's tiles
  for (const player of game.players) {
    if (player.tableau.has(CardName.WORM_RIDER) &&
      game.board.getAdjacentSpaces(space).some((adjacent) => adjacent.player?.id === player.id && Board.hasRealTile(adjacent))) {
      player.stock.add(Resource.TITANIUM, 2, {log: true});
    }
  }
  const tile = space.tile;
  if (tile === undefined) {
    return undefined;
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
    return undefined;
  }
  if (owner === undefined) {
    return undefined;
  }
  if (Board.isCitySpace(space)) {
    game.log('Worm riders of ${0} ride Shai-Hulud', (b) => b.player(owner));
    owner.stock.add(Resource.TITANIUM, 1, {log: true});
    owner.stock.add(Resource.HEAT, 2, {log: true});
  } else if (Board.isGreenerySpace(space)) {
    // Dune Stabiliser card: the worm spares the greenery placed by it
    if (spared.includes(space.id)) {
      game.log('Shai-Hulud spares the stabilised greenery of ${0}', (b) => b.player(owner));
      return undefined;
    }
    game.log('Shai-Hulud tramples a greenery of ${0}', (b) => b.player(owner));
    return takeLevy(owner, Resource.PLANTS);
  } else if (tile.tileType === TileType.NATURAL_PRESERVE) {
    owner.increaseTerraformRating(1, {log: true});
  } else {
    game.log('Shai-Hulud damages a special tile of ${0}', (b) => b.player(owner));
    return takeLevy(owner, Resource.MEGACREDITS);
  }
  return undefined;
}

/** Rolls the die for this generation's move and fixes the heading (turning away from blocked spaces) */
export function rollWorm(game: IGame, worm: WormData): void {
  worm.roll = game.rng.nextInt(6) + 1;
  worm.direction = wormDirection(game.board, worm.spaceId, worm.roll);
  game.log('Shai-Hulud stirs: the die shows ${0}', (b) => b.number(worm.roll ?? 1));
  if (worm.direction !== undefined && worm.direction !== directionIndex(worm.roll)) {
    game.log('Rock blocks the way: Shai-Hulud turns clockwise');
  }
}

export function moveWorm(game: IGame, worm: WormData, distance: number): void {
  const path = wormPath(game.board, worm.spaceId, worm.direction, distance);
  game.log('Shai-Hulud moves ${0} space(s)', (b) => b.number(path.length));
  const levies: Array<PendingLevy> = [];
  for (const space of path) {
    const levy = crossSpace(game, space, worm.spared);
    if (levy !== undefined) {
      levies.push(levy);
    }
  }
  worm.levies = levies.length > 0 ? levies : undefined;
  worm.path = path.map((space) => space.id);
  // Games saved before the trail was recorded start it at the space this move leaves
  worm.trailStart ??= worm.spaceId;
  worm.trail = [...(worm.trail ?? []), {generation: game.generation, path: worm.path}];
  if (path.length > 0) {
    worm.spaceId = path[path.length - 1].id;
  }
  worm.chooser = undefined;
  worm.thumper = undefined;
}

/**
 * The distances worth choosing: each one ends on a new space (at the rim or before rock the worm stops early, so longer
 * distances would only repeat the last move). At least one entry, also when the worm cannot move at all.
 */
export function wormChoices(game: IGame, worm: WormData): Array<{distance: number, path: Array<Space>}> {
  const choices: Array<{distance: number, path: Array<Space>}> = [];
  const max = maxWormDistance(game);
  for (let distance = 1; distance <= max; distance++) {
    const path = wormPath(game.board, worm.spaceId, worm.direction, distance);
    if (choices.length === 0 || path.length > choices[choices.length - 1].path.length) {
      choices.push({distance, path});
    }
  }
  return choices;
}

export function distanceInput(game: IGame, worm: WormData): OrOptions {
  const options = wormChoices(game, worm).map(({distance, path}) => {
    // Label with the space the worm ends on, so the chooser sees where it goes
    const end = path.length === 0 ? worm.spaceId : path[path.length - 1].id;
    return new SelectOption(message('${0} space(s): to ${1}', (b) => b.number(path.length).rawString(arrakisCoordinate(end))), 'Move')
      .andThen(() => {
        moveWorm(game, worm, distance);
        return undefined;
      });
  });
  // Plain title: the AI recognises the choice by it (ai/duneChoices.ts); the die shows on the Dune tab
  return new OrOptions(...options).setTitle(WORM_TITLE);
}

export function wormModel(game: IGame, worm: WormData): WormModel {
  return {
    spaceId: worm.spaceId,
    roll: worm.roll,
    direction: worm.direction,
    turned: worm.roll !== undefined && worm.direction !== undefined && worm.direction !== directionIndex(worm.roll),
    path: worm.path,
    trail: {start: worm.trailStart ?? worm.spaceId, moves: worm.trail ?? []},
    chooser: worm.chooser === undefined ? undefined : game.getPlayerById(worm.chooser as IPlayer['id']).color,
    // In the order of the options of distanceInput, so the client can show them on a piece of the map
    choices: worm.chooser === undefined ? undefined : wormChoices(game, worm).map(({path}) => path.map((space) => space.id)),
  };
}
