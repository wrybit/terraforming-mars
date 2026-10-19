import {BoardName} from '../boards/BoardName';
import {Expansion} from '../cards/GameModule';
import {MilestoneName} from '../ma/MilestoneName';
import {AwardName} from '../ma/AwardName';

// Theme of a game: only what is shown changes (texts, icons, board picture), never the rules.
// "dune" plays exactly like Terraforming Mars; card names, costs, tags and values stay the same internally,
// so the AI, statistics, logs and upstream merges keep working. Saved games without a theme are "mars".
export const THEMES = ['mars', 'dune'] as const;
export type Theme = typeof THEMES[number];

export const DEFAULT_THEME: Theme = 'mars';

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as ReadonlyArray<string>).includes(value);
}

/** Expansions the Dune theme has texts and pictures for; all others are locked while Dune is chosen. */
export const DUNE_EXPANSIONS: ReadonlyArray<Expansion> = ['corpera', 'prelude', 'prelude2'];

/** The only board of the Dune theme; the Mars theme never uses it. */
export const DUNE_BOARD = BoardName.ARRAKIS;

/** Milestones of the Dune theme: the Tharsis ones under Dune names (theme texts only). Arrakis offers them. */
export const DUNE_MILESTONES: ReadonlyArray<MilestoneName> = ['Terraformer', 'Mayor', 'Gardener', 'Builder', 'Planner'];

/** Awards of the Dune theme: the Tharsis ones under Dune names (theme texts only). Arrakis offers them. */
export const DUNE_AWARDS: ReadonlyArray<AwardName> = ['Landlord', 'Scientist', 'Banker', 'Thermalist', 'Miner'];

/** True when `expansion` can be played with `theme`. */
export function themeAllowsExpansion(theme: Theme, expansion: Expansion): boolean {
  return theme === 'mars' || DUNE_EXPANSIONS.includes(expansion);
}

/** True when `board` (a board or a random board option) can be played with `theme`. */
export function themeAllowsBoard(theme: Theme, board: string): boolean {
  return theme === 'dune' ? board === DUNE_BOARD : board !== DUNE_BOARD;
}

/** Reasons a new game's settings do not fit its theme (English, translated on display); empty when they fit. */
export function themeConflicts(theme: Theme, board: string | undefined, expansions: Partial<Record<Expansion, boolean>> | undefined): Array<string> {
  const conflicts: Array<string> = [];
  if (!themeAllowsBoard(theme, board ?? '')) {
    conflicts.push(theme === 'dune' ? 'The Dune theme is played on Arrakis.' : 'Arrakis is only available with the Dune theme.');
  }
  const blocked = (Object.entries(expansions ?? {}) as Array<[Expansion, boolean]>)
    .some(([expansion, enabled]) => enabled && !themeAllowsExpansion(theme, expansion));
  if (blocked) {
    conflicts.push('The Dune theme is only available with Corporate Era, Prelude and Prelude 2.');
  }
  return conflicts;
}
