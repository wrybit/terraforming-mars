/* Lage des Globus über dem tatsächlichen Layout: Die Buttons sind je nach Gerät unterschiedlich hoch und breit.
   Damit die Bögen von Button zu Button (und zum Titel) zusammenpassen, wird der Globus einheitlich skaliert –
   nach dem Abstand der Buttons untereinander, nicht nach ihrer Breite – und jeder Button bekommt seine Lage darin. */
import {SPRITE_ROW} from './planetStripes';

export type GlobePlacement = {
  // CSS-Pixel je Sprite-Pixel (Desktop: 1)
  scale: number;
  // Oberkante des Buttons im Sprite-Raster (erster Button: 90 = Reihe 1)
  spriteTop: number;
};

export type GlobeLayout = {
  scale: number;
  placements: Array<GlobePlacement>;
  // Abstand Titel-Oberkante zur Oberkante der Sprite-Reihe 0 (CSS-Pixel), für den Titel-Hintergrund
  titleOffset: number;
};

// Abstand der Buttons auf dem Desktop (90px hoch + 5px Lücke): dort ist der Globus unskaliert
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
  // Sprite-Reihe 0 endet dort, wo der erste Button beginnt
  const titleOffset = title === undefined ? 0 : first - title.getBoundingClientRect().top - SPRITE_ROW.height * scale;
  return {scale, placements, titleOffset};
}
