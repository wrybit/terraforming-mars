/* Position of the globe over the actual layout: the buttons differ in height and width depending on the device.
   So the arcs from button to button (and to the title) line up, the globe is scaled uniformly –
   by the spacing between the buttons, not by their width – and each button gets its position within it. */
import {SPRITE_ROW} from './planetStripes';

export type GlobePlacement = {
  // CSS pixels per sprite pixel (desktop: 1)
  scale: number;
  // Top edge of the button in the sprite grid (first button: 90 = row 1)
  spriteTop: number;
};

export type GlobeLayout = {
  scale: number;
  placements: Array<GlobePlacement>;
  // Distance from title top edge to top edge of sprite row 0 (CSS pixels), for the title background
  titleOffset: number;
};

// Button spacing on desktop (90px high + 5px gap): there the globe is unscaled
const DESKTOP_PITCH = SPRITE_ROW.height + 5;

export function measureGlobeLayout(buttons: ReadonlyArray<HTMLElement>, title: HTMLElement | undefined): GlobeLayout | undefined {
  if (buttons.length < 2) {
    return undefined;
  }
  const tops = buttons.map((button) => button.getBoundingClientRect().top);
  const first = tops[0];
  const pitch = (tops[tops.length - 1] - first) / (tops.length - 1);
  if (pitch <= 0) {
    return undefined;
  }
  const scale = pitch / DESKTOP_PITCH;
  const placements = tops.map((top) => ({scale, spriteTop: SPRITE_ROW.height + (top - first) / scale}));
  // Sprite row 0 ends where the first button begins
  const titleOffset = title === undefined ? 0 : first - title.getBoundingClientRect().top - SPRITE_ROW.height * scale;
  return {scale, placements, titleOffset};
}
