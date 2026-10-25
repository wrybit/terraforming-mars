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
import {WormModel} from '../../common/dune/DuneModel';
import {PendingLevy, takeLevy} from './WormLevy';
import {arrakisCoordinate} from '../../common/dune/arrakisCoordinates';
import {CardName} from '../../common/cards/CardName';
import {Random} from '../../common/utils/Random';
import {WORM_START_SPACES} from '../../common/dune/wormStartSpaces';
import {ARRAKIS_LAYOUT, ArrakisLayout} from '../../common/dune/arrakisLayout';
import {Arrakis61Board} from '../boards/Arrakis61Board';
import {THUMPER_DISTANCE, wormDistanceFor} from '../../common/dune/wormDistance';
import {SPICE_BLOW_MAX, WORM_DOMAIN_TR, WORM_RIDER_SPICE, WORM_RIDER_WATER, wormEffectKind} from '../../common/dune/wormEffects';

// Module C – Shai-Hulud (claude/dune-erweiterung-konzept.md): a worm marker wanders over Arrakis. At the end of
// every generation a die gives the direction, the weakest player (least TR) chooses 1–3 spaces, and every space the
// worm crosses – the last one included – takes effect. Rock, the worm border around the polar sink and the edge of
// the board bounce it off like a ball off a wall (angle of incidence = angle of reflection, Jens 21 Oct 2026): a slanted
// wall turns it by 120°, a single obstacle straight ahead sends it back. Bouncing costs no step, so the move goes round
// corners; also a blocked rolled direction bounces right away. Nothing may be placed on the space under the worm.

export type WormData = {
  spaceId: SpaceId,
  /** Die of the running or last move (1 top right … 6 top left, clockwise) */
  roll?: number,
  /** Heading of the first step of that move after bouncing off blocked spaces (index of getAdjacentSpacesClockwise) */
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

/** A start space in the deep desert of the south (G3); the tests use it as a fixed starting point */
export const WORM_START: SpaceId = '48' as SpaceId;

// Where the worm may start: common/dune/wormStartSpaces.ts (the Shai-Hulud tab lists the same spaces as a rule)
export {WORM_START_SPACES};

export function wormStart(rng: Random, layout: ArrakisLayout = ARRAKIS_LAYOUT): SpaceId {
  return layout.wormStartSpaces[rng.nextInt(layout.wormStartSpaces.length)];
}

/** Terrain of the board the worm moves on: the standard or the large Arrakis */
function layoutOf(board: Board): ArrakisLayout {
  return board instanceof Arrakis61Board ? board.layout : ARRAKIS_LAYOUT;
}

export {WORM_TITLE};

/** Clockwise index of getAdjacentSpacesClockwise (0 top left … 5 left) for a die roll (1 top right … 6 top left) */
export function directionIndex(roll: number): number {
  return roll % 6;
}

/** The greener Arrakis, the weaker the worm: the vegetation track in three sections (common/dune/wormDistance.ts) */
export function maxWormDistance(game: IGame): number {
  return wormDistanceFor(game.getOxygenLevel(), game.max.oxygen);
}

/** The weakest player chooses the distance: least TR, on a tie the later one in turn order */
export function wormChooser(game: IGame): IPlayer {
  const order = game.playersInGenerationOrder;
  return order.reduce((weakest, player) => (player.terraformRating <= weakest.terraformRating ? player : weakest), order[0]);
}

function stopsWorm(board: Board, space: Space | undefined): boolean {
  if (space === undefined) {
    return true;
  }
  const layout = layoutOf(board);
  const zone = layout.zones[space.id];
  return zone === 'rock' || zone === 'city' || layout.behindWormBorder.includes(space.id);
}

// Each of the six headings is mirrored at most once per step
const MAX_BOUNCES = 6;

/**
 * New heading after hitting a blocked space: mirrored at the wall the blocked spaces form. Blocked ahead and on the
 * left (counter-clockwise) side → the wall runs slanted, the worm leaves 120° clockwise; ahead and right → 120°
 * counter-clockwise; a single obstacle ahead (or a corner) → straight back.
 */
export function bouncedDirection(board: Board, at: Space, direction: number): number {
  const neighbours = board.getAdjacentSpacesClockwise(at);
  const left = stopsWorm(board, neighbours[(direction + 5) % 6]);
  const right = stopsWorm(board, neighbours[(direction + 1) % 6]);
  if (left && !right) {
    return (direction + 2) % 6;
  }
  if (right && !left) {
    return (direction + 4) % 6;
  }
  return (direction + 3) % 6;
}

/** Heading of the next step from `at`: `direction`, or where the worm bounces to; undefined when boxed in */
function freeDirection(board: Board, at: Space, direction: number): number | undefined {
  const neighbours = board.getAdjacentSpacesClockwise(at);
  const tried = new Set<number>();
  let heading = direction;
  while (tried.size < MAX_BOUNCES && !tried.has(heading)) {
    if (!stopsWorm(board, neighbours[heading])) {
      return heading;
    }
    tried.add(heading);
    heading = bouncedDirection(board, at, heading);
  }
  // In a nook the mirrored headings can all be blocked: then the next free one clockwise, so the worm never sticks
  // while a way out exists
  for (let turn = 1; turn < 6; turn++) {
    const clockwise = (direction + turn) % 6;
    if (!stopsWorm(board, neighbours[clockwise])) {
      return clockwise;
    }
  }
  return undefined;
}

/** Heading of the first step for a die roll: the rolled direction, or where it bounces to; undefined when boxed in */
export function wormDirection(board: Board, from: SpaceId, roll: number): number | undefined {
  return freeDirection(board, board.getSpaceOrThrow(from), directionIndex(roll));
}

/** Spaces the worm crosses heading `direction` for `distance`, bouncing off blocked spaces (fewer when boxed in) */
export function wormPath(board: Board, from: SpaceId, direction: number | undefined, distance: number): Array<Space> {
  const path: Array<Space> = [];
  if (direction === undefined) {
    return path;
  }
  let current = board.getSpaceOrThrow(from);
  let heading = direction;
  for (let step = 0; step < distance; step++) {
    const free = freeDirection(board, current, heading);
    if (free === undefined) {
      break;
    }
    heading = free;
    const next = board.getAdjacentSpacesClockwise(current)[heading];
    if (next === undefined) {
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
      player.game.log('The worm riders of ${0} follow Shai-Hulud', (b) => b.player(player));
      player.stock.add(Resource.TITANIUM, 2, {log: true});
    }
  }
  const owner = space.player;
  switch (wormEffectKind(space.tile?.tileType, owner !== undefined)) {
  case 'spice-blow': {
    // Spice blow: +1 spice for each adjacent tile of a player, at most SPICE_BLOW_MAX in total
    game.log('Spice blow at ${0}', (b) => b.space(space));
    let given = 0;
    for (const adjacent of game.board.getAdjacentSpaces(space)) {
      if (given >= SPICE_BLOW_MAX) {
        break;
      }
      if (adjacent.player !== undefined && Board.hasRealTile(adjacent)) {
        adjacent.player.stock.add(Resource.TITANIUM, 1, {log: true});
        given++;
      }
    }
    return undefined;
  }
  case 'worm-riders':
    if (owner !== undefined) {
      game.log('Worm riders of ${0} ride Shai-Hulud', (b) => b.player(owner));
      owner.stock.add(Resource.TITANIUM, WORM_RIDER_SPICE, {log: true});
      owner.stock.add(Resource.HEAT, WORM_RIDER_WATER, {log: true});
    }
    return undefined;
  case 'trampled':
    if (owner === undefined) {
      return undefined;
    }
    // Dune Stabiliser card: the worm spares the greenery placed by it
    if (spared.includes(space.id)) {
      game.log('Shai-Hulud spares the stabilised greenery of ${0}', (b) => b.player(owner));
      return undefined;
    }
    game.log('Shai-Hulud tramples a greenery of ${0}', (b) => b.player(owner));
    return takeLevy(owner, Resource.PLANTS);
  case 'domain':
    if (owner !== undefined) {
      game.log('Shai-Hulud reaches the worm domain of ${0}', (b) => b.player(owner));
      owner.increaseTerraformRating(WORM_DOMAIN_TR, {log: true});
    }
    return undefined;
  case 'damaged':
    if (owner === undefined) {
      return undefined;
    }
    game.log('Shai-Hulud damages a special tile of ${0}', (b) => b.player(owner));
    return takeLevy(owner, Resource.MEGACREDITS);
  case 'none':
    return undefined;
  }
}

/** The line a heading runs along: a heading and its opposite share it (0 and 3, 1 and 4, 2 and 5) */
export function wormLine(direction: number): number {
  return direction % 3;
}

/**
 * Rolls the die for this generation's move and fixes the heading of the first step (bouncing off blocked spaces).
 * A move along the same line as the last one (either way) is rolled once more: bouncing straight back made the worm
 * shuttle along one line in 45 % of the moves on Arrakis 61 (fair: 33 %), with the second roll 22 % (Jens, 22 Oct 2026).
 */
export function rollWorm(game: IGame, worm: WormData): void {
  const lastLine = worm.direction === undefined ? undefined : wormLine(worm.direction);
  rollDie(game, worm);
  if (lastLine !== undefined && worm.direction !== undefined && wormLine(worm.direction) === lastLine) {
    rollDie(game, worm);
  }
  // Only the heading that counts, once it is fixed (after a second roll or a bounce): the face of the die for that
  // heading and its name, e.g. "(3) bottom right" (Jens 25 Oct 2026)
  const face = worm.direction === undefined ? (worm.roll ?? 1) : headingFace(worm.direction);
  game.log('Shai-Hulud heads (${0}) ${1}', (b) => b.number(face).string(HEADING_NAMES[face - 1]));
}

/** Names of the headings by die face, clockwise from top right (directionIndex) */
const HEADING_NAMES = ['top right', 'right', 'bottom right', 'bottom left', 'left', 'top left'];

/** Die face of a heading: the inverse of directionIndex */
function headingFace(direction: number): number {
  return direction === 0 ? 6 : direction;
}

function rollDie(game: IGame, worm: WormData): void {
  worm.roll = game.rng.nextInt(6) + 1;
  worm.direction = wormDirection(game.board, worm.spaceId, worm.roll);
}

export function moveWorm(game: IGame, worm: WormData, distance: number, chooser?: IPlayer): void {
  const path = wormPath(game.board, worm.spaceId, worm.direction, distance);
  // Who chose and why (Jens 25 Oct 2026): the weakest player with their TR, or the owner of the Thumper card
  if (chooser === undefined) {
    game.log('Shai-Hulud moves ${0} space(s)', (b) => b.number(path.length));
  } else if (worm.thumper === chooser.id) {
    game.log('Shai-Hulud moves ${0} space(s), ${1} decides with ${2}', (b) => b.number(path.length).player(chooser).cardName(CardName.THUMPER));
  } else {
    game.log('Shai-Hulud moves ${0} space(s), ${1} decides with ${2} TR', (b) => b.number(path.length).player(chooser).number(chooser.terraformRating));
  }
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
  // The board keeps the space free and shows the worm there: tell it at once, not only on the next load
  if (game.board instanceof Arrakis61Board) {
    game.board.wormSpaceId = worm.spaceId;
  }
  worm.chooser = undefined;
  worm.thumper = undefined;
}

/** Largest distance of this move: by the vegetation, or 1 to 3 with the Thumper card, whatever the vegetation (Jens 22 Oct 2026) */
export function wormDistanceLimit(game: IGame, worm: WormData): number {
  return worm.thumper !== undefined ? Math.max(THUMPER_DISTANCE, maxWormDistance(game)) : maxWormDistance(game);
}

/**
 * The distances worth choosing: each one ends on a new space (at the rim or before rock the worm stops early, so longer
 * distances would only repeat the last move). At least one entry, also when the worm cannot move at all.
 */
export function wormChoices(game: IGame, worm: WormData): Array<{distance: number, path: Array<Space>}> {
  const choices: Array<{distance: number, path: Array<Space>}> = [];
  const max = wormDistanceLimit(game, worm);
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
    return new SelectOption(message('${0} space(s): to ${1}', (b) => b.number(path.length).rawString(arrakisCoordinate(layoutOf(game.board), end))), 'Move')
      .andThen(() => {
        moveWorm(game, worm, distance, worm.chooser === undefined ? undefined : game.getPlayerById(worm.chooser as IPlayer['id']));
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
    ...(worm.thumper !== undefined ? {thumper: true as const} : {}),
    // In the order of the options of distanceInput, so the client can show them on a piece of the map
    choices: worm.chooser === undefined ? undefined : wormChoices(game, worm).map(({path}) => path.map((space) => space.id)),
  };
}
