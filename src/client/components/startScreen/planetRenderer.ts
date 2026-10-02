/* Gemeinsamer Vertrag der Planeten-Zeichner: WebGL (planetGlobeRenderer.ts, gewölbt mit Licht) oder,
   ohne WebGL, CSS (planetFlatRenderer.ts, flach verschobener Streifen mit Verlauf). */
import {PlanetStripe} from './planetStripes';

export type PlanetDrawRequest = {
  // Fläche hinter dem Button-Text; WebGL zeichnet hinein, CSS nutzt sie als Hintergrund-Box
  target: HTMLCanvasElement;
  // Reihe im Globus (1 = erster Menüpunkt)
  row: number;
  stripe: PlanetStripe;
  // Drehung in Sprite-Pixeln Oberfläche
  offset: number;
  // 0 = Ruhe, 1 = Hover
  glow: number;
};

export interface PlanetRenderer {
  draw(request: PlanetDrawRequest): void;
}
