import {ArrakisLayout} from './arrakisLayout';

// Coordinates of Arrakis spaces as in the mockup (like chess, "E4"): rows from A at the top, the number counts the
// spaces of the row from the left. Space ids start at 03 and run row by row (ArrakisBoard.ts, ArrakisLargeBoard.ts).
// Every function takes the layout of the game's board (arrakisLayout.ts).

/** Row and place in the row of a space; undefined for spaces off the board */
function rowAndIndex(layout: ArrakisLayout, spaceId: string): {row: number, index: number} | undefined {
  let index = Number(spaceId) - 3;
  for (let row = 0; row < layout.rowLengths.length; row++) {
    if (index >= 0 && index < layout.rowLengths[row]) {
      return {row, index};
    }
    index -= layout.rowLengths[row];
  }
  return undefined;
}

export function arrakisCoordinate(layout: ArrakisLayout, spaceId: string): string {
  const place = rowAndIndex(layout, spaceId);
  return place === undefined ? spaceId : String.fromCharCode(65 + place.row) + String(place.index + 1);
}

/** Row letter of an Arrakis space; undefined for spaces off the board */
export function arrakisRow(layout: ArrakisLayout, spaceId: string): string | undefined {
  const place = rowAndIndex(layout, spaceId);
  return place === undefined ? undefined : String.fromCharCode(65 + place.row);
}

// Place of a space on the drawn board (board_items_positions.less, standard and large maps): each row 41px below the
// last, each space 49px right of the last, each row indented half a space for every row it is away from the middle row.
const FIRST_LEFT = 6;
const FIRST_TOP = 34;
const SPACE_STEP = 49;
const ROW_STEP = 41;

/** Top left of an Arrakis space on the board in px; undefined for spaces off the board */
export function arrakisSpacePosition(layout: ArrakisLayout, spaceId: string): {x: number, y: number} | undefined {
  const place = rowAndIndex(layout, spaceId);
  if (place === undefined) {
    return undefined;
  }
  const middleRow = (layout.rowLengths.length - 1) / 2;
  const indent = Math.abs(place.row - middleRow) * SPACE_STEP / 2;
  return {x: FIRST_LEFT + indent + place.index * SPACE_STEP, y: FIRST_TOP + place.row * ROW_STEP};
}

/** Ids of all spaces of the board, row by row from the top ("03" …) */
export function arrakisSpaceIds(layout: ArrakisLayout): Array<string> {
  const count = layout.rowLengths.reduce((sum, length) => sum + length, 0);
  return Array.from({length: count}, (_value, index) => String(index + 3).padStart(2, '0'));
}

/** Ids of the spaces around an Arrakis space (neighbours are one space step apart on the drawn board) */
export function arrakisNeighbours(layout: ArrakisLayout, spaceId: string): Array<string> {
  const center = arrakisSpacePosition(layout, spaceId);
  if (center === undefined) {
    return [];
  }
  return arrakisSpaceIds(layout).filter((id) => {
    const position = arrakisSpacePosition(layout, id);
    return id !== spaceId && position !== undefined && Math.hypot(position.x - center.x, position.y - center.y) < SPACE_STEP + 2;
  });
}
