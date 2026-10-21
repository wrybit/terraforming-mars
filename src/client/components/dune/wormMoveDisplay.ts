import {Color} from '@/common/Color';
import {HAZARD_TILES} from '@/common/TileType';
import {SpaceModel} from '@/common/models/SpaceModel';
import {SPICE_BLOW_MAX, WORM_DOMAIN_TR, WORM_LEVY_UNITS, WORM_RIDER_SPICE, WORM_RIDER_WATER, wormEffectKind} from '@/common/dune/wormEffects';

// What the worm move shows besides the map (WormMoveInput.vue): a chip with the effect on every space with a tile,
// the result of the chosen way per player and the edges where the worm leaves a space in a new heading.

/** Dune pictures of the resources (duneGraphic) */
export type WormResource = 'res-plant' | 'res-solari' | 'res-spice' | 'res-water' | 'res-landsraad';
export type WormChipItem = {amount: number, resource: WormResource};
export type WormChip = {tone: 'gain' | 'loss' | 'neutral', items: Array<WormChipItem>, times?: number};
type Gain = {color: Color, resource: WormResource, amount: number};

function hasPlayerTile(space: SpaceModel | undefined): space is SpaceModel & {color: Color} {
  return space?.color !== undefined && space.tileType !== undefined && !HAZARD_TILES.has(space.tileType);
}

/** Effect of crossing `space` as a chip and as gains per player; undefined when nothing happens */
export function wormEffect(space: SpaceModel, neighbours: ReadonlyArray<SpaceModel | undefined>): {chip: WormChip, gains: Array<Gain>} | undefined {
  const owner = space.color;
  switch (wormEffectKind(space.tileType, owner !== undefined)) {
  case 'spice-blow': {
    const receivers = neighbours.filter(hasPlayerTile).slice(0, SPICE_BLOW_MAX);
    return {
      chip: {tone: 'neutral', items: [{amount: 1, resource: 'res-spice'}], times: receivers.length},
      gains: receivers.map((neighbour) => ({color: neighbour.color, resource: 'res-spice', amount: 1})),
    };
  }
  case 'worm-riders':
    return owner === undefined ? undefined : {
      chip: {tone: 'gain', items: [{amount: WORM_RIDER_SPICE, resource: 'res-spice'}, {amount: WORM_RIDER_WATER, resource: 'res-water'}]},
      gains: [{color: owner, resource: 'res-spice', amount: WORM_RIDER_SPICE}, {color: owner, resource: 'res-water', amount: WORM_RIDER_WATER}],
    };
  case 'trampled':
    return owner === undefined ? undefined : {
      chip: {tone: 'loss', items: [{amount: -WORM_LEVY_UNITS, resource: 'res-plant'}]},
      gains: [{color: owner, resource: 'res-plant', amount: -WORM_LEVY_UNITS}],
    };
  case 'damaged':
    return owner === undefined ? undefined : {
      chip: {tone: 'loss', items: [{amount: -WORM_LEVY_UNITS, resource: 'res-solari'}]},
      gains: [{color: owner, resource: 'res-solari', amount: -WORM_LEVY_UNITS}],
    };
  case 'domain':
    return owner === undefined ? undefined : {
      chip: {tone: 'gain', items: [{amount: WORM_DOMAIN_TR, resource: 'res-landsraad'}]},
      gains: [{color: owner, resource: 'res-landsraad', amount: WORM_DOMAIN_TR}],
    };
  case 'none':
    return undefined;
  }
}

/** Sum of all gains along a way, one entry per player in order of appearance */
export function wormOutcome(effects: ReadonlyArray<{gains: Array<Gain>} | undefined>): Array<{color: Color, chips: Array<WormChip>}> {
  const totals = new Map<Color, Map<WormResource, number>>();
  for (const effect of effects) {
    for (const gain of effect?.gains ?? []) {
      const resources = totals.get(gain.color) ?? new Map<WormResource, number>();
      resources.set(gain.resource, (resources.get(gain.resource) ?? 0) + gain.amount);
      totals.set(gain.color, resources);
    }
  }
  return [...totals.entries()].map(([color, resources]) => ({
    color,
    chips: [...resources.entries()].filter(([, amount]) => amount !== 0)
      .map(([resource, amount]) => ({tone: amount < 0 ? 'loss' : 'gain', items: [{amount, resource}]})),
  }));
}

export type Point = {x: number, y: number};
export type Heading = Point & {angle: number};
/**
 * What the worm bounced off: the centre of the blocked space (marked on its hex) and the edge it hit (marked as a bar
 * when that space is not on the map piece, e.g. the board edge)
 */
export type Wall = {obstacle: Point, x1: number, y1: number, x2: number, y2: number};

// From the centre of a space to the centre of its neighbour, in board pixels (46 × 51 spaces), by heading index
// (0 top left … 5 left, clockwise like getAdjacentSpacesClockwise)
const NEIGHBOUR_OFFSETS: ReadonlyArray<Point> = [
  {x: -23, y: -38.25}, {x: 23, y: -38.25}, {x: 46, y: 0}, {x: 23, y: 38.25}, {x: -23, y: 38.25}, {x: -46, y: 0},
];
// Half the length of a wall line (a hex edge is about 26 px)
const WALL_HALF = 13;

function angleOf(vector: Point): number {
  return Math.atan2(vector.y, vector.x) * 180 / Math.PI;
}

// Same heading when the angles agree to a sixth of a turn (the spaces are not quite regular hexes)
function sameHeading(first: Point, second: Point): boolean {
  return Math.round(angleOf(first) / 60) === Math.round(angleOf(second) / 60);
}

function wallAt(center: Point, towards: Point): Wall {
  const length = Math.hypot(towards.x, towards.y) || 1;
  const middle = {x: center.x + towards.x / 2, y: center.y + towards.y / 2};
  const across = {x: -towards.y / length * WALL_HALF, y: towards.x / length * WALL_HALF};
  return {obstacle: {x: center.x + towards.x, y: center.y + towards.y},
    x1: middle.x - across.x, y1: middle.y - across.y, x2: middle.x + across.x, y2: middle.y + across.y};
}

// Two discs on the same edge (a bounce straight back crosses it twice): this far apart along the edge
const SHARED_EDGE_SHIFT = 9;

/**
 * Marks along the way (centres of the worm's space and the spaces crossed), Jens 21 Oct 2026:
 * - a disc with the heading on every edge the worm crosses: worm → 1, 1 → 2, 2 → 3
 * - the wall it bounced off: at the start when the rolled heading was blocked, and wherever it changes heading
 *   (the space ahead in its old heading)
 */
export function wormBounceMarks(points: ReadonlyArray<Point>, rolledDirection: number | undefined): {headings: Array<Heading>, walls: Array<Wall>} {
  const headings: Array<Heading> = [];
  const walls: Array<Wall> = [];
  const steps = points.slice(1).map((point, index) => ({x: point.x - points[index].x, y: point.y - points[index].y}));
  if (steps.length === 0) {
    return {headings, walls};
  }
  const rolled = rolledDirection === undefined ? undefined : NEIGHBOUR_OFFSETS[rolledDirection];
  if (rolled !== undefined && !sameHeading(rolled, steps[0])) {
    walls.push(wallAt(points[0], rolled));
  }
  steps.forEach((step, index) => {
    const from = points[index];
    if (index > 0 && !sameHeading(steps[index - 1], step)) {
      walls.push(wallAt(from, steps[index - 1]));
    }
    const heading = {x: from.x + step.x / 2, y: from.y + step.y / 2, angle: angleOf(step)};
    const shared = headings.find((other) => Math.abs(other.x - heading.x) < 1 && Math.abs(other.y - heading.y) < 1);
    if (shared !== undefined) {
      // Side by side along the edge instead of on top of each other
      const length = Math.hypot(step.x, step.y) || 1;
      const along = {x: -step.y / length * SHARED_EDGE_SHIFT, y: step.x / length * SHARED_EDGE_SHIFT};
      shared.x -= along.x;
      shared.y -= along.y;
      heading.x += along.x;
      heading.y += along.y;
    }
    headings.push(heading);
  });
  return {headings, walls};
}
