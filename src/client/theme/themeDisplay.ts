import {activeTheme} from '@/client/theme/applyTheme';
import duneGraphics from '@/themes/dune/graphics.json';

// Values and pictures as the active theme shows them. The game always counts in Mars units; only the display changes.

const GRAPHICS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  dune: duneGraphics,
};

/** Picture path for an <img> (e.g. 'assets/tiles/ocean.png'), replaced by the theme's picture if it has one. */
export function themedAsset(asset: string): string {
  const theme = activeTheme();
  const replacement = GRAPHICS[theme]?.[asset.replace(/^\.?\/?assets\//, '')];
  return replacement === undefined ? asset : `assets/themes/${theme}/${replacement}`;
}

/** Temperature as shown: °C on Mars, the water storage in percent on Arrakis (−30 °C = 0 %, +8 °C = 38 %). */
export function temperatureValue(celsius: number): number {
  return activeTheme() === 'dune' ? celsius + 30 : celsius;
}

export function temperatureUnit(): string {
  return activeTheme() === 'dune' ? '%' : '°C';
}

/** Value with unit and sign as on the board scale: "+4 °C", "-12 °C", "18 %" */
export function temperatureText(celsius: number, signed = false): string {
  const value = temperatureValue(celsius);
  const sign = signed && value > 0 && activeTheme() !== 'dune' ? '+' : '';
  return `${sign}${value} ${temperatureUnit()}`;
}
