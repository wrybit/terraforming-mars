// Spots of the player cubes on one step of the envy track (SmugglingPanel.vue; Jens 25 Oct 2026): spread over the free
// strip of the step, never on top of each other. Two layouts, the CSS picks one by the width (dune_board.less):
// - row (wide): the box keeps its height, the cubes lie side by side; each gets its own slot of one cube width (in
//   random order), and the free width of the strip is shared out at random between the gaps;
// - grid (narrow, phone): the steps are too narrow for two cubes side by side, so one column with a row per cube,
//   in random order and at a random place across the width; from the second cube on the box grows by a row.
// The same step and players always give the same spots, so the cubes do not jump on every update.

export type CubeSpot = {
  // Row: place in the row (0 = leftmost) and the share of the free width left of the cube, 0 … 1
  slot: number,
  shift: number,
  // Grid: cell of the cube and its place inside it, 0 … 1 of the room the cell leaves around the cube
  column: number,
  row: number,
  x: number,
  // Both: place in the height, 0 … 1 of the room left above the cube
  y: number,
};

export const GRID_COLUMNS = 1;

export function gridRows(count: number): number {
  return Math.max(1, Math.ceil(count / GRID_COLUMNS));
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

function shuffled(length: number, random: () => number): Array<number> {
  const values = Array.from({length}, (_, index) => index);
  for (let index = values.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [values[index], values[other]] = [values[other], values[index]];
  }
  return values;
}

/** One spot per key (the player colours of this step, in a fixed order); `seed` names the step */
export function cubeSpots(keys: ReadonlyArray<string>, seed: string): Array<CubeSpot> {
  const random = seededRandom(seed + ':' + keys.join(','));
  const slots = shuffled(keys.length, random);
  // Where the free width goes: sorted random cuts, one per cube
  const shifts = keys.map(() => random()).sort((a, b) => a - b);
  const cells = shuffled(GRID_COLUMNS * gridRows(keys.length), random);
  return keys.map((_, index) => ({
    slot: slots[index],
    shift: shifts[slots[index]],
    column: cells[index] % GRID_COLUMNS,
    row: Math.floor(cells[index] / GRID_COLUMNS),
    x: random(),
    y: random(),
  }));
}
