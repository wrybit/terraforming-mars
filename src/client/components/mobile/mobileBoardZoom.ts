// Breite des Planeten samt Feldern im Brett (px bei zoom 1), vgl. MARS_CROP in mobileFit.ts
const MARS_WIDTH = 550;
// Planet so groß wie die kürzere Fensterseite mal diesem Faktor
const SHORT_SIDE_FACTOR = 1.4;

/* Zoom des vergrößerten Bretts (BoardZoomModal) in der Mobil-Ansicht für ein Fenster `width` × `height` px. */
export function mobileBoardZoom(width: number, height: number): number {
  return Math.min(width, height) * SHORT_SIDE_FACTOR / MARS_WIDTH;
}
