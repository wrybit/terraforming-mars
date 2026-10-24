import {Theme} from '../theme/Theme';

// Modules of the Dune expansion (claude/dune-erweiterung-konzept.md). Unlike the theme they change the rules,
// so each one is switched on on its own: a module can be tested – or dropped – without losing the others.
// Only with the Dune theme. Saved games without the option have none.
// goals: the milestones and awards of the mockup for random draws (common/dune/duneGoals.ts); changes no rule itself
// choam: since 24 Oct 2026 smuggling and the CHOAM contracts are one module; 'smuggling' stays for saved games and
// settings and switches on the whole module too, but is no longer offered on its own
export const DUNE_MODULES = ['bazaar', 'worm', 'kanly', 'schemes', 'choam', 'smuggling', 'goals'] as const;
export type DuneModule = typeof DUNE_MODULES[number];

/** Modules that are built; the create-game form offers only these and the server refuses the others. */
export const PLAYABLE_DUNE_MODULES: ReadonlyArray<DuneModule> = DUNE_MODULES.filter((module) => module !== 'smuggling');

/** Names in the create-game form and the game settings (English, translated on display) */
export const DUNE_MODULE_LABEL: Record<DuneModule, string> = {
  bazaar: 'Bazaar of Arrakeen',
  worm: 'Shai-Hulud',
  kanly: 'Kanly',
  schemes: 'House schemes',
  choam: 'CHOAM',
  smuggling: 'CHOAM',
  goals: 'Milestones & awards of Arrakis',
};

export function isDuneModule(value: unknown): value is DuneModule {
  return typeof value === 'string' && (DUNE_MODULES as ReadonlyArray<string>).includes(value);
}

/** Reasons the chosen modules do not fit the game (English, translated on display); empty when they fit. */
export function duneModuleConflicts(theme: Theme, modules: ReadonlyArray<unknown> | undefined): Array<string> {
  const chosen = modules ?? [];
  if (chosen.length === 0) {
    return [];
  }
  if (theme !== 'dune') {
    return ['The Dune expansion is only available with the Dune theme.'];
  }
  const unknown = chosen.filter((module) => !isDuneModule(module) || !PLAYABLE_DUNE_MODULES.includes(module));
  // The former smuggling module is part of CHOAM now: settings saved with it still start a game
  const known = unknown.filter((module) => module !== 'smuggling');
  return known.length > 0 ? [`Unknown Dune module: ${known.map(String).join(', ')}`] : [];
}

/** Module each card of the Dune expansion belongs to; 'any' = in play with any module (theme cards) */
export const DUNE_CARD_MODULE: Readonly<Record<string, DuneModule | 'any'>> = {
  'Bazaar Concession': 'bazaar',
  'Caravan Master': 'bazaar',
  'Mentat Calculation': 'schemes',
  'Tleilaxu Spy': 'schemes',
  'Thumper': 'worm',
  'Worm Rider': 'worm',
  'Dune Stabiliser': 'worm',
  'CHOAM Directorate': 'choam',
  'Guild Bank': 'choam',
  'Smuggler Network': 'choam',
  'Friends of Esmar Tuek': 'choam',
  'Sardaukar Raid': 'choam',
  'Sardaukar Mercenaries': 'kanly',
  'Shield Generator': 'kanly',
  'Recruit Sardaukar': 'kanly',
  'Water of Life': 'any',
  'Stillsuit Factory': 'any',
};

/** Whether a card of the Dune expansion is in play with these modules */
export function duneCardInPlay(cardName: string, modules: ReadonlyArray<DuneModule>): boolean {
  const module = DUNE_CARD_MODULE[cardName];
  // Games with the former smuggling module have CHOAM
  const chosen = modules.includes('smuggling') ? [...modules, 'choam' as const] : modules;
  return module !== undefined && chosen.length > 0 && (module === 'any' || chosen.includes(module));
}
