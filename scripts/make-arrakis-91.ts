// Builds the large Arrakis board (six spaces a side, 91 spaces like Amazonis Planitia) from the standard Arrakis board.
// Why: the large board must keep the geography of the standard one – rock where the mountains are, spice fields in the
// open erg, plants around the basins and the polar sink. So every space of the large board takes over from the
// standard space at the same place on the planet; the bonus totals grow with the number of spaces (91 / 61).
// Never edit the generated files by hand – change this script or the standard board and run:
//   npx tsx scripts/make-arrakis-91.ts
// Writes src/common/dune/arrakis91Terrain.ts and src/server/boards/arrakis91Spaces.ts.
import * as fs from 'fs';
import * as path from 'path';
import {Arrakis61Board} from '../src/server/boards/Arrakis61Board';
import {DEFAULT_GAME_OPTIONS} from '../src/server/game/GameOptions';
import {SeededRandom} from '../src/common/utils/Random';
import {SpaceType} from '../src/common/boards/SpaceType';
import {SpaceBonus} from '../src/common/boards/SpaceBonus';
import {SpaceName} from '../src/common/boards/SpaceName';
import {ARRAKIS_ZONES, ArrakisZone, BEHIND_WORM_BORDER} from '../src/common/dune/arrakisTerrain';
import {WORM_START_SPACES} from '../src/common/dune/wormStartSpaces';

const ROOT = path.join(__dirname, '..');
// Both boards: each space 49 px right of the last, each row 41 px below (board_items_positions.less); the planet
// radius on the board (mobileBoardZoom.ts PLANET_BOUNDS, PLANET_BOUNDS_LARGE) makes the positions comparable
const SPACE_STEP = 49;
const ROW_STEP = 41;
type Grid = {rowLengths: Array<number>, middleRow: number, radius: number};
const STANDARD: Grid = {rowLengths: [5, 6, 7, 8, 9, 8, 7, 6, 5], middleRow: 4, radius: 449 / 2};
const LARGE: Grid = {rowLengths: [6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6], middleRow: 5, radius: 549 / 2};
// Totals grow with the board, oceans included; volcanoes stay four (the named mountains of the standard board)
const GROWTH = 91 / 61;

type Cell = {id: string, row: number, column: number, x: number, y: number};
function cells(grid: Grid): Array<Cell> {
  const result: Array<Cell> = [];
  grid.rowLengths.forEach((length, row) => {
    for (let column = 0; column < length; column++) {
      const indent = Math.abs(row - grid.middleRow) * SPACE_STEP / 2;
      // Relative to the middle space, in planet radii
      const x = (indent + column * SPACE_STEP - grid.middleRow * SPACE_STEP) / grid.radius;
      const y = (row - grid.middleRow) * ROW_STEP / grid.radius;
      result.push({id: String(result.length + 3).padStart(2, '0'), row, column, x, y});
    }
  });
  return result;
}

const standardBoard = Arrakis61Board.newInstance({...DEFAULT_GAME_OPTIONS, shuffleMapOption: false}, new SeededRandom(0));
const standardCells = cells(STANDARD);
const largeCells = cells(LARGE);
const standardSpace = (id: string) => standardBoard.getSpaceOrThrow(id as never);
const distance = (a: Cell, b: Cell) => Math.hypot(a.x - b.x, a.y - b.y);
const nearestStandard = (cell: Cell) => standardCells.reduce((best, other) => distance(cell, other) < distance(cell, best) ? other : best);
const nearestLarge = (cell: Cell, free: (cell: Cell) => boolean = () => true) =>
  largeCells.filter(free).reduce((best, other) => distance(cell, other) < distance(cell, best) ? other : best);
const source = new Map(largeCells.map((cell) => [cell.id, nearestStandard(cell)]));

// Fixed places first: Arrakeen and the four volcanic mountains each on the large space nearest to theirs
const taken = new Set<string>();
const claim = (standard: Cell) => {
  const cell = nearestLarge(standard, (c) => !taken.has(c.id));
  taken.add(cell.id);
  return cell;
};
const arrakeen = claim(standardCells.find((cell) => cell.id === SpaceName.ARRAKEEN)!);
const volcanic = new Map<string, string>();
for (const cell of standardCells.filter((c) => standardSpace(c.id).volcanic === true)) {
  volcanic.set(claim(cell).id, cell.id);
}

// Oceans (spice fields): first the large space nearest to every standard one, then the closest others of their regions
const standardOceans = standardCells.filter((cell) => standardSpace(cell.id).spaceType === SpaceType.OCEAN);
const oceanTarget = Math.round(standardOceans.length * GROWTH);
const oceans = new Set<string>();
for (const cell of standardOceans) {
  const large = claim(cell);
  oceans.add(large.id);
}
const oceanCandidates = largeCells
  .filter((cell) => !taken.has(cell.id) && standardSpace(source.get(cell.id)!.id).spaceType === SpaceType.OCEAN)
  .sort((a, b) => distance(a, source.get(a.id)!) - distance(b, source.get(b.id)!));
for (const cell of oceanCandidates.slice(0, oceanTarget - oceans.size)) {
  oceans.add(cell.id);
  taken.add(cell.id);
}
// Still short: the free spaces closest to a standard spice field
const closestTo = (targets: ReadonlyArray<Cell>) => (a: Cell, b: Cell) =>
  Math.min(...targets.map((t) => distance(a, t))) - Math.min(...targets.map((t) => distance(b, t)));
for (const cell of largeCells.filter((c) => !taken.has(c.id)).sort(closestTo(standardOceans)).slice(0, Math.max(0, oceanTarget - oceans.size))) {
  oceans.add(cell.id);
  taken.add(cell.id);
}

// Bonuses: every standard space hands its bonus to the large space nearest to it; then copies go to the other spaces
// of its region, closest first, until each bonus reaches its grown total. Fixed places keep the bonus of their place.
const bonuses = new Map<string, Array<SpaceBonus>>(largeCells.map((cell) => [cell.id, []]));
const counts = new Map<SpaceBonus, number>();
const add = (id: string, bonus: ReadonlyArray<SpaceBonus>) => {
  bonuses.set(id, [...bonus]);
  bonus.forEach((b) => counts.set(b, (counts.get(b) ?? 0) + 1));
};
const standardTotals = new Map<SpaceBonus, number>();
standardCells.forEach((cell) => standardSpace(cell.id).bonus.forEach((b) => standardTotals.set(b, (standardTotals.get(b) ?? 0) + 1)));
const firstOwner = new Map<string, string>();
add(arrakeen.id, standardSpace(SpaceName.ARRAKEEN).bonus);
firstOwner.set(SpaceName.ARRAKEEN, arrakeen.id);
volcanic.forEach((standardId, largeId) => {
  add(largeId, standardSpace(standardId).bonus);
  firstOwner.set(standardId, largeId);
});
for (const cell of standardCells) {
  if (firstOwner.has(cell.id)) {
    continue;
  }
  // The large space of its region nearest to it, an ocean when the standard space is one
  const isOcean = standardSpace(cell.id).spaceType === SpaceType.OCEAN;
  const region = largeCells.filter((c) => c.id !== arrakeen.id && !volcanic.has(c.id) &&
    oceans.has(c.id) === isOcean && ![...firstOwner.values()].includes(c.id));
  const owner = region.reduce((best, other) => distance(cell, other) < distance(cell, best) ? other : best);
  add(owner.id, standardSpace(cell.id).bonus);
  firstOwner.set(cell.id, owner.id);
}
const owners = new Set(firstOwner.values());
const copies = largeCells
  .filter((cell) => !owners.has(cell.id) && standardSpace(source.get(cell.id)!.id).bonus.length > 0)
  .sort((a, b) => distance(a, source.get(a.id)!) - distance(b, source.get(b.id)!));
for (const cell of copies) {
  const bonus = standardSpace(source.get(cell.id)!.id).bonus;
  const fits = bonus.every((b) => (counts.get(b) ?? 0) + bonus.filter((x) => x === b).length <= Math.round(standardTotals.get(b)! * GROWTH));
  if (fits) {
    add(cell.id, bonus);
  }
}
// Still short of a total: one unit at a time on the empty space closest to a standard space with that bonus
const target = (bonus: SpaceBonus) => Math.round(standardTotals.get(bonus)! * GROWTH);
for (const bonus of standardTotals.keys()) {
  const homes = standardCells.filter((cell) => standardSpace(cell.id).bonus.includes(bonus));
  const empty = largeCells.filter((cell) => bonuses.get(cell.id)!.length === 0 && cell.id !== arrakeen.id).sort(closestTo(homes));
  while ((counts.get(bonus) ?? 0) < target(bonus) && empty.length > 0) {
    add(empty.shift()!.id, [bonus]);
  }
}

// Terrain: the zone of the standard space at the same place; spice fields only on oceans, the city only on Arrakeen
const zones: Record<string, ArrakisZone> = {};
for (const cell of largeCells) {
  const zone = ARRAKIS_ZONES[source.get(cell.id)!.id] ?? 'erg';
  zones[cell.id] = oceans.has(cell.id) ? 'spicefield' : cell.id === arrakeen.id ? 'city' : zone === 'spicefield' || zone === 'city' ? 'erg' : zone;
}
const behindBorder = largeCells.filter((cell) => BEHIND_WORM_BORDER.includes(source.get(cell.id)!.id)).map((cell) => cell.id);
const wormStart = largeCells.filter((cell) => (WORM_START_SPACES as ReadonlyArray<string>).includes(source.get(cell.id)!.id)).map((cell) => cell.id);
const placeNames: Record<string, string> = {};
volcanic.forEach((standardId, largeId) => {
  const name = {'05': 'Tharsis Tholus', '12': 'Pavonis Mons', '23': 'Ascraeus Mons', '36': 'Arsia Mons'}[standardId];
  if (name !== undefined) {
    placeNames[largeId] = name;
  }
});
placeNames[arrakeen.id] = 'Noctis City';

// --- Output ---
const BONUS_NAME: Partial<Record<SpaceBonus, string>> = {
  [SpaceBonus.PLANT]: 'PLANT', [SpaceBonus.STEEL]: 'STEEL', [SpaceBonus.TITANIUM]: 'TITANIUM', [SpaceBonus.DRAW_CARD]: 'DRAW_CARD',
  [SpaceBonus.HEAT]: 'HEAT', [SpaceBonus.ENERGY]: 'ENERGY',
};
const quote = (value: string) => `'${value}'`;
const spaceLines = LARGE.rowLengths.map((_, row) => '  [' + largeCells.filter((cell) => cell.row === row).map((cell) => {
  const kind = oceans.has(cell.id) ? 'ocean' : volcanic.has(cell.id) ? 'volcanic' : 'land';
  return `{kind: '${kind}', bonus: [${bonuses.get(cell.id)!.map((b) => 'SpaceBonus.' + BONUS_NAME[b]).join(', ')}]}`;
}).join(', ') + '],');
fs.writeFileSync(path.join(ROOT, 'src/server/boards/arrakis91Spaces.ts'), `// GENERATED by scripts/make-arrakis-91.ts from the standard Arrakis board – do not edit by hand.
// The large Arrakis board row by row (6 to 11 spaces, ids 03 to 93 in reading order), read by Arrakis91Board.ts.
import {SpaceBonus} from '../../common/boards/SpaceBonus';

export type Arrakis91Space = {kind: 'ocean' | 'land' | 'volcanic', bonus: Array<SpaceBonus>};

export const ARRAKIS_91_ROWS: ReadonlyArray<ReadonlyArray<Arrakis91Space>> = [
${spaceLines.join('\n')}
];

/** Arrakeen, reserved like Noctis City */
export const ARRAKIS_91_ARRAKEEN = ${quote(arrakeen.id)};
`);

const record = (entries: Record<string, string>) => '{\n' + Object.entries(entries).map(([key, value]) => `  ${quote(key)}: ${quote(value)},`).join('\n') + '\n}';
const list = (values: Array<string>) => '[' + values.map(quote).join(', ') + ']';
fs.writeFileSync(path.join(ROOT, 'src/common/dune/arrakis91Terrain.ts'), `// GENERATED by scripts/make-arrakis-91.ts from the standard Arrakis board – do not edit by hand.
// Terrain of every space of the large Arrakis board (Arrakis91Board.ts), the spaces behind the worm border,
// where the worm may start and the spaces with a place name – each taken over from the standard board at the same place.
import {ArrakisZone} from './arrakisTerrain';

export const ARRAKIS_91_ZONES: Readonly<Record<string, ArrakisZone>> = ${record(zones)};

/** Spaces behind the worm border (polar sink): the worm never enters them */
export const ARRAKIS_91_BEHIND_WORM_BORDER: ReadonlyArray<string> = ${list(behindBorder)};

/** Where the worm may start, chosen at random */
export const ARRAKIS_91_WORM_START_SPACES: ReadonlyArray<string> = ${list(wormStart)};

/** Spaces with a place name on the board (translation keys of the Dune theme) */
export const ARRAKIS_91_PLACE_NAMES: Readonly<Record<string, string>> = ${record(placeNames)};
`);

const total = (map: Map<SpaceBonus, number>) => Object.fromEntries([...map].map(([b, n]) => [BONUS_NAME[b], n]));
console.log('oceans', oceans.size, 'volcanic', volcanic.size, 'arrakeen', arrakeen.id);
console.log('standard', total(standardTotals));
console.log('large   ', total(counts));
console.log('behind border', behindBorder.join(' '), '| worm start', wormStart.join(' '));
