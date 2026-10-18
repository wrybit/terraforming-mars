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
