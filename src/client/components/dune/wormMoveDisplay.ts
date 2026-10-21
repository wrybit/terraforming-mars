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

/** Edges where the worm leaves a space in a new heading: the first step and every bounce (midpoint and angle) */
export function wormHeadings(points: ReadonlyArray<Point>): Array<Heading> {
  const headings: Array<Heading> = [];
  let previous: number | undefined;
  for (let index = 0; index + 1 < points.length; index++) {
    const from = points[index];
    const to = points[index + 1];
    const angle = Math.round(Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI);
    if (previous === undefined || angle !== previous) {
      headings.push({x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, angle});
    }
    previous = angle;
  }
  return headings;
}
