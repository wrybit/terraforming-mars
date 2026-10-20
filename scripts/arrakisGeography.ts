// Terrain of the Arrakis map for the board generators (make-arrakis-61.ts, make-arrakis-91.ts).
// Why: what lies on a space – rock, ice, basin, spice field – must match the drawn map
// (assets/themes/dune/source/arrakis-globe.png). scripts/measure-arrakis-globe.py measures the map under every space;
// here are the rules that turn the measures into zones, spice fields and bonus kinds – the same for both boards.
import * as fs from 'fs';
import * as path from 'path';
import {SpaceBonus} from '../src/common/boards/SpaceBonus';
import {ArrakisZone} from '../src/common/dune/arrakisTerrain';

export type Measure = {u: number, v: number, rock: number, ice: number, spice: number, basin: number};
export type BoardMeasures = Readonly<Record<string, Measure>>;

export function loadMeasures(board: '61' | '91'): BoardMeasures {
  const file = path.join(__dirname, 'data', 'arrakis-globe-terrain.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'))[board];
}

// Share of the space that makes it rock, ice or basin
const ROCK = 0.45;
const ICE = 0.05;
const BASIN = 0.5;

/** Zone of a space after the map, spice fields and Arrakeen aside (the board sets those) */
export function landZone(measure: Measure): ArrakisZone {
  if (measure.rock >= ROCK) {
    return 'rock';
  }
  if (measure.ice >= ICE) {
    return 'ice';
  }
  return measure.basin >= BASIN ? 'basin' : 'erg';
}

/**
 * The spice fields (ocean spaces) of a board: the spaces with the most spice patches on the map, only in open sand and
 * not in the worm's nest (start spaces and polar sink); a basin only with strong spice. Spaces that were spice fields get
 * a small lead, so faint patches do not move them and the board stays stable from run to run.
 */
export function chooseSpiceFields(measures: BoardMeasures, count: number, excluded: ReadonlySet<string>, previous: ReadonlySet<string>): Set<string> {
  const STABILITY = 0.04;
  const BASIN_SPICE = 0.2;
  const candidates = Object.entries(measures)
    .filter(([id, measure]) => !excluded.has(id) && measure.rock < ROCK && measure.ice < ICE &&
      (measure.basin < BASIN || measure.spice >= BASIN_SPICE))
    .map(([id, measure]) => ({id, score: measure.spice + (previous.has(id) ? STABILITY : 0)}))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  if (candidates.length < count) {
    throw new Error(`only ${candidates.length} spaces for ${count} spice fields`);
  }
  return new Set(candidates.slice(0, count).map((candidate) => candidate.id));
}

const PLANT_LIKE: ReadonlyArray<SpaceBonus> = [SpaceBonus.PLANT, SpaceBonus.HEAT, SpaceBonus.ENERGY];

/**
 * Plant-like bonuses follow the terrain one to one (the sum stays that of Tharsis): in sand, basins and Arrakeen
 * something grows (plant), spice fields and ice give water (heat), rock gives moisture (energy).
 */
export function bonusForZone(bonus: ReadonlyArray<SpaceBonus>, zone: ArrakisZone): Array<SpaceBonus> {
  const kind = zone === 'spicefield' || zone === 'ice' ? SpaceBonus.HEAT : zone === 'rock' ? SpaceBonus.ENERGY : SpaceBonus.PLANT;
  return bonus.map((b) => PLANT_LIKE.includes(b) ? kind : b);
}

/** Distance of two spaces on the planet, in planet diameters */
export function planetDistance(a: Measure, b: Measure): number {
  return Math.hypot(a.u - b.u, a.v - b.v);
}
