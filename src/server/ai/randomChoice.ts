// Small random helpers shared by the simulation scripts.
// The random source is injectable so runs can be made reproducible later (seeded RNG).

export type RandomSource = () => number;

export function integerBetween(random: RandomSource, minimum: number, maximum: number): number {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

export function pickOne<T>(random: RandomSource, items: ReadonlyArray<T>): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from an empty list');
  }
  return items[Math.floor(random() * items.length)];
}

/** Picks `count` distinct items (Fisher-Yates on a copy). */
export function pickSome<T>(random: RandomSource, items: ReadonlyArray<T>, count: number): Array<T> {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy.slice(0, count);
}

/** Small seeded generator (mulberry32): the same seed gives the same sequence. */
export function seededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
