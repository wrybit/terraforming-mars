/* Shared contract of the planet renderers: WebGL (planetGlobeRenderer.ts, curved with lighting) or,
   without WebGL, CSS (planetFlatRenderer.ts, flat shifted strip with gradient). */
import {GlobePlacement} from './globeLayout';
import {PlanetStripe} from './planetStripes';

export type PlanetDrawRequest = {
  // Surface behind the button text; WebGL draws into it, CSS uses it as a background box
  target: HTMLCanvasElement;
  // Button's position in the globe (globeLayout.ts)
  placement: GlobePlacement;
  stripe: PlanetStripe;
  // Rotation in sprite pixels of surface
  offset: number;
  // 0 = idle, 1 = hover
  glow: number;
};

export interface PlanetRenderer {
  draw(request: PlanetDrawRequest): void;
}
