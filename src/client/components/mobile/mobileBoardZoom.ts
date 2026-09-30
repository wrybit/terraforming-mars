/* Mars ohne Skalen-Ring: Ausschnitt des Bretts (.board-cont, px bei zoom 1) mit Planet und den
   Kolonie-Feldern in den oberen Ecken. Startscreen (mobileFit.ts) und großer Mars (BoardZoomModal) zeigen
   denselben Ausschnitt, damit Proportionen und Lage der Kolonie-Felder übereinstimmen. */
export const MARS_CROP = {left: 42, top: 62, width: 550, height: 486};
/* Mitte des Planeten relativ zur linken oberen Ecke des Bretts (.board-cont), px bei zoom 1. */
export const PLANET_CENTER = {x: 316, y: 310};
// Platz für Statusleiste, Kopf und Zoom-Leiste des großen Mars
const CHROME_HEIGHT = 170;
const SIDE_MARGIN = 16;
// Zoom relativ zum ganzen Planeten (1 = 100 %): Start beim Öffnen, Höchstwert, Schrittweite von − und +
export const DEFAULT_ZOOM_RATIO = 2;
export const MAX_ZOOM_RATIO = 3;
export const ZOOM_STEP_RATIO = 0.25;

/* Nächste Stufe im 25-%-Raster in Richtung `direction` (+1 größer, −1 kleiner), begrenzt auf 100–300 %. */
export function steppedZoomRatio(ratio: number, direction: 1 | -1): number {
  // Zwischenwerte (nach Pinch) rasten auf die nächste Stufe in Zugrichtung ein
  const position = ratio / ZOOM_STEP_RATIO;
  const steps = direction > 0 ? Math.floor(position + 1e-6) + 1 : Math.ceil(position - 1e-6) - 1;
  return Math.min(MAX_ZOOM_RATIO, Math.max(1, steps * ZOOM_STEP_RATIO));
}

/* Zoom, bei dem der ganze Ausschnitt (Planet samt Kolonie-Feldern) in ein Fenster `width` × `height` px passt – ohne Scrollen. */
export function wholePlanetZoom(width: number, height: number): number {
  return Math.min((width - 2 * SIDE_MARGIN) / MARS_CROP.width, (height - CHROME_HEIGHT) / MARS_CROP.height);
}
