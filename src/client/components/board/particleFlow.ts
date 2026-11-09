/** One particle: its path in board px (with the SVG transform of its group), size, colour and two own clocks (seconds) */
export type ParticleFlow = {
  path: string,
  transform?: string,
  radius: number,
  colour: string,
  travel: number,
  travelBegin: number,
  blink: number,
  blinkBegin: number,
  /** Opacity at the start, middle and end of each blink */
  opacity: [number, number, number],
};
