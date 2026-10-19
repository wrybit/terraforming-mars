import {Theme} from '@/common/theme/Theme';

// Name and planet picture of each theme, shared by the Mars/Dune switch and the admin games overview.
// Names, not words: the Dune texts would turn "Mars" into "Arrakis".
// Pictures are set inline by the components, not in a stylesheet: the Dune stylesheet (src/tools/themeCss.ts)
// swaps every Mars picture of the game's styles for Arrakis, which would turn this Mars into Arrakis as well.
export type ThemePlanet = {theme: Theme, label: string, planet: string};

export const THEME_PLANETS: Readonly<Record<Theme, ThemePlanet>> = {
  mars: {theme: 'mars', label: 'Mars', planet: 'assets/board/mars-planet.png'},
  dune: {theme: 'dune', label: 'Dune', planet: 'assets/themes/dune/arrakis-planet.png'},
};
