// How far the worm may move (Jens, 21 Oct 2026): the vegetation track is split into three sections, left to right
// distance 1, 2 and 3. Placed greeneries fill it from the right; the first free step from the right lies in the
// section that gives the largest distance. Server (dune/Worm.ts maxWormDistance) and client (WormVegetationBar.vue)
// both read this file, so the bar always shows what the server allows.

/** Sizes of the three sections, left (distance 1) to right (distance 3); the rest of an uneven split goes to the left */
export function wormDistanceSections(maxVegetation: number): Array<number> {
  const base = Math.floor(maxVegetation / 3);
  const rest = maxVegetation % 3;
  return [base + (rest > 0 ? 1 : 0), base + (rest > 1 ? 1 : 0), base];
}

/** Largest distance for a vegetation level; a full track still lets the worm move 1 space */
export function wormDistanceFor(vegetation: number, maxVegetation: number): number {
  const free = maxVegetation - vegetation;
  if (free <= 0) {
    return 1;
  }
  let end = 0;
  const sections = wormDistanceSections(maxVegetation);
  for (let index = 0; index < sections.length; index++) {
    end += sections[index];
    if (free <= end) {
      return index + 1;
    }
  }
  return sections.length;
}
