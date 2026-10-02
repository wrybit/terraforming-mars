/* Gemeinsamer Vertrag der Planeten-Zeichner: WebGL (planetGlobeRenderer.ts, gewölbt mit Licht) oder,
   ohne WebGL, CSS (planetFlatRenderer.ts, flach verschobener Streifen mit Verlauf). */
import {GlobePlacement} from './globeLayout';
import {PlanetStripe} from './planetStripes';

export type PlanetDrawRequest = {
  // Fläche hinter dem Button-Text; WebGL zeichnet hinein, CSS nutzt sie als Hintergrund-Box
  target: HTMLCanvasElement;
  // Lage des Buttons im Globus (globeLayout.ts)
  placement: GlobePlacement;
  stripe: PlanetStripe;
  // Drehung in Sprite-Pixeln Oberfläche
  offset: number;
  // 0 = Ruhe, 1 = Hover
  glow: number;
};

export interface PlanetRenderer {
  draw(request: PlanetDrawRequest): void;
}
