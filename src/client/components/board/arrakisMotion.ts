// Motion of the Arrakis scales and the spice fields (ArrakisScales.vue, ArrakisSpiceFields.vue): fixed randomness,
// so particles keep their places when the board redraws, and an own pace per element, so nothing moves in step
// with anything else (Jens, 20 Oct 2026: "Alles soll asynchron sein").

/** Fixed random numbers in [0, 1) from a seed (Park–Miller): the same seed gives the same particles on every draw */
export function seededRandom(seed: number): () => number {
  let state = Math.max(1, Math.floor(seed) % 2147483647);
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function hash(key: string): number {
  let value = 7;
  for (const char of key) {
    value = (value * 31 + char.charCodeAt(0)) % 2147483647;
  }
  return value + 1;
}

export type MotionStyle = {animationDuration: string, animationDelay: string};

/**
 * Own duration (0.75 to 1.35 times the base) and own phase for one animated element, fixed by its key: vegetation and
 * water storage, every badge and glow run on their own clock instead of breathing together
 */
export function desync(key: string, baseSeconds: number): MotionStyle {
  const random = seededRandom(hash(key));
  random();
  const duration = baseSeconds * (0.75 + random() * 0.6);
  return {animationDuration: `${duration.toFixed(2)}s`, animationDelay: `-${(random() * duration).toFixed(2)}s`};
}

/** One particle moving along a path: size, colour share, travel time, blink time and both phases (SMIL, seconds) */
export type Particle = {
  radius: number,
  /** Offset across the path (board px) */
  offset: number,
  /** Share of the coloured end in the mix with white (0 = white) */
  colourShare: number,
  travel: number,
  travelBegin: number,
  blink: number,
  blinkBegin: number,
};

export type ParticleSpread = {count: number, spread: number, minRadius: number, radiusRange: number,
  minTravel: number, travelRange: number, minBlink: number, blinkRange: number, maxColourShare: number};

export function particles(seed: number, spread: ParticleSpread): Array<Particle> {
  const random = seededRandom(seed);
  const result: Array<Particle> = [];
  for (let index = 0; index < spread.count; index++) {
    const offset = (random() - 0.5) * spread.spread;
    const radius = spread.minRadius + random() * spread.radiusRange;
    const colourShare = random() * spread.maxColourShare;
    const travel = spread.minTravel + random() * spread.travelRange;
    const travelBegin = random() * travel;
    const blink = spread.minBlink + random() * spread.blinkRange;
    const blinkBegin = random() * blink;
    result.push({radius, offset, colourShare, travel, travelBegin, blink, blinkBegin});
  }
  return result;
}

/** White mixed with a colour, for particles that range from white to the colour of their band */
export function whiteTo(colour: string, share: number): string {
  return `color-mix(in oklab, ${colour} ${Math.round(share * 100)}%, #fff)`;
}
