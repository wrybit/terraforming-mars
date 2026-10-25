// Spots of the player cubes on one step of the envy track (SmugglingPanel.vue; Jens 25 Oct 2026): spread in x and y
// over the free area of the step, never on top of each other. The area is split into cells (2 rows, 2 or 3 columns);
// each cube gets its own cell, picked at random, and a random place inside it. The same step and players always give
// the same spots, so the cubes do not jump on every update.

export type CubeSpot = {
  // Cell of the cube, counted from the top left of the area
  column: number,
  row: number,
  // Place inside the cell, 0 … 1 of the room the cell leaves around the cube
  x: number,
  y: number,
};

export const SPOT_ROWS = 2;

/** Columns of the area: 2 for up to 4 cubes, 3 for more */
export function spotColumns(count: number): number {
  return count <= 4 ? 2 : 3;
}

// Small seeded random numbers (FNV-1a hash, then xorshift), the same on every client
function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index++) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 10000) / 10000;
  };
}

/** One spot per key (the player colours of this step, in a fixed order); `seed` names the step */
export function cubeSpots(keys: ReadonlyArray<string>, seed: string): Array<CubeSpot> {
  const columns = spotColumns(keys.length);
  const random = seededRandom(seed + ':' + keys.join(','));
  const cells = Array.from({length: columns * SPOT_ROWS}, (_, index) => index);
  // Shuffle the cells (Fisher–Yates), then each cube takes the next one
  for (let index = cells.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [cells[index], cells[other]] = [cells[other], cells[index]];
  }
  return keys.map((_, index) => {
    const cell = cells[index % cells.length];
    return {column: cell % columns, row: Math.floor(cell / columns), x: random(), y: random()};
  });
}
