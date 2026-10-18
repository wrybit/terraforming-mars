import {activeTheme} from '@/client/theme/applyTheme';
import duneGraphics from '@/themes/dune/graphics.json';
import duneCardScenes from '@/themes/dune/card-scenes.json';

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

// Scenes with a picture of their own (the first matching tag decides, as in the Dune mockup); the rest get the plain desert
const SCENE_TAGS: ReadonlyArray<string> = ['plant', 'power', 'space', 'earth', 'jovian', 'microbe', 'animal', 'building', 'science', 'city'];

/** Picture behind a card in the Dune theme, undefined on Mars (cards there have none). */
export function cardScene(cardName: string, tags: ReadonlyArray<string>): string | undefined {
  if (activeTheme() !== 'dune') {
    return undefined;
  }
  const scenes: Readonly<Record<string, string>> = duneCardScenes;
  const file = scenes[cardName] ?? `scene-${tags.find((tag) => SCENE_TAGS.includes(tag)) ?? 'none'}`;
  return `assets/themes/dune/graphics/${file}.svg`;
}

// Milestone and award symbols of the Dune theme where the Dune version shows something else than Mars
// (the Dune mockup's goals page): asset paths below assets/ without extension, as in milestoneAwardIcons.ts
const DUNE_GOAL_ICONS: Readonly<Record<string, ReadonlyArray<{asset: string}>>> = {
  'Landlord': [{asset: 'tiles/city'}, {asset: 'tiles/greenery'}, {asset: 'tiles/special'}],
  'Scientist': [{asset: 'tags/science'}],
};

/** Symbol parts of a milestone or award in the active theme (the given Mars parts unless the theme has its own). */
export function themedGoalIcon<Part extends {asset: string}>(name: string, parts: ReadonlyArray<Part>): ReadonlyArray<Part | {asset: string}> {
  return activeTheme() === 'dune' ? DUNE_GOAL_ICONS[name] ?? parts : parts;
}
