// Coordinates of Arrakis spaces as in the mockup (like chess, "E4"): rows A–I from the top, the number counts the
// spaces of the row from the left. Space ids start at 03 and run row by row (ArrakisBoard.ts).
const ROW_LENGTHS: ReadonlyArray<number> = [5, 6, 7, 8, 9, 8, 7, 6, 5];

export function arrakisCoordinate(spaceId: string): string {
  let index = Number(spaceId) - 3;
  for (let row = 0; row < ROW_LENGTHS.length; row++) {
    if (index < ROW_LENGTHS[row]) {
      return String.fromCharCode(65 + row) + String(index + 1);
    }
    index -= ROW_LENGTHS[row];
  }
  return spaceId;
}

/** Row letter (A–I) of an Arrakis space; undefined for spaces off the board */
export function arrakisRow(spaceId: string): string | undefined {
  const coordinate = arrakisCoordinate(spaceId);
  return coordinate === spaceId ? undefined : coordinate.charAt(0);
}

// Place of a space on the drawn board (board_items_positions.less, standard maps): each row 41px below the last, each
// space 49px right of the last, each row indented half a space for every row it is away from the middle row.
const FIRST_SPACE = {x: 104, y: 34};
const SPACE_STEP = 49;
const ROW_STEP = 41;
const MIDDLE_ROW = 4;

/** Top left of an Arrakis space on the board in px; undefined for spaces off the board */
export function arrakisSpacePosition(spaceId: string): {x: number, y: number} | undefined {
  let index = Number(spaceId) - 3;
  for (let row = 0; row < ROW_LENGTHS.length; row++) {
    if (index < ROW_LENGTHS[row]) {
      const indent = (MIDDLE_ROW - Math.abs(row - MIDDLE_ROW)) * SPACE_STEP / 2;
      return {x: FIRST_SPACE.x - indent + index * SPACE_STEP, y: FIRST_SPACE.y + row * ROW_STEP};
    }
    index -= ROW_LENGTHS[row];
  }
  return undefined;
}

/** Ids of the spaces around an Arrakis space (neighbours are one space step apart on the drawn board) */
export function arrakisNeighbours(spaceId: string): Array<string> {
  const center = arrakisSpacePosition(spaceId);
  if (center === undefined) {
    return [];
  }
  const total = ROW_LENGTHS.reduce((sum, length) => sum + length, 0);
  const neighbours: Array<string> = [];
  for (let number = 3; number < 3 + total; number++) {
    const id = String(number).padStart(2, '0');
    const position = arrakisSpacePosition(id);
    if (id !== spaceId && position !== undefined && Math.hypot(position.x - center.x, position.y - center.y) < SPACE_STEP + 2) {
      neighbours.push(id);
    }
  }
  return neighbours;
}

/** Spaces with a place name on the board (translation keys of the Dune theme, client Legends.ts) */
export const ARRAKIS_PLACE_NAMES: Readonly<Record<string, string>> = {
  '05': 'Tharsis Tholus',
  '12': 'Pavonis Mons',
  '19': 'Noctis City',
  '23': 'Ascraeus Mons',
  '36': 'Arsia Mons',
};
