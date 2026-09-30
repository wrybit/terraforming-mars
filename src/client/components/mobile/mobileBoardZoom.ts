// Planet im Brett-Hintergrund (px bei zoom 1, Ellipse aus assets/board/mars-planet.png)
const PLANET_WIDTH = 449;
const PLANET_HEIGHT = 449;
/* Mitte des Planeten relativ zur linken oberen Ecke des Bretts (.board-cont), px bei zoom 1. */
export const PLANET_CENTER = {x: 316, y: 310};
// Platz für Statusleiste, Kopf und Zoom-Leiste des großen Mars
const CHROME_HEIGHT = 170;
const SIDE_MARGIN = 16;
// Stärkster Zoom relativ zum ganzen Planeten
export const MAX_ZOOM_RATIO = 4;
// Beim Platzieren startet der große Mars etwas näher (Felder antippbar), sonst mit dem ganzen Planeten
export const PLACEMENT_ZOOM_RATIO = 1.4;

/* Zoom, bei dem der ganze Planet in ein Fenster `width` × `height` px passt. */
export function wholePlanetZoom(width: number, height: number): number {
  return Math.min((width - 2 * SIDE_MARGIN) / PLANET_WIDTH, (height - CHROME_HEIGHT) / PLANET_HEIGHT);
}
