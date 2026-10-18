import {Theme} from '../theme/Theme';

// Modules of the Dune expansion (claude/dune-erweiterung-konzept.md). Unlike the theme they change the rules,
// so each one is switched on on its own: a module can be tested – or dropped – without losing the others.
// Only with the Dune theme. Saved games without the option have none.
export const DUNE_MODULES = ['bazaar', 'worm', 'kanly', 'schemes', 'choam', 'smuggling'] as const;
export type DuneModule = typeof DUNE_MODULES[number];

/** Modules that are built; the create-game form offers only these and the server refuses the others. */
export const PLAYABLE_DUNE_MODULES: ReadonlyArray<DuneModule> = ['bazaar'];

/** Names in the create-game form and the game settings (English, translated on display) */
export const DUNE_MODULE_LABEL: Record<DuneModule, string> = {
  bazaar: 'Bazaar of Arrakeen',
  worm: 'Shai-Hulud',
  kanly: 'Kanly',
  schemes: 'House schemes',
  choam: 'CHOAM contracts',
  smuggling: 'Smuggling & suspicion',
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
  return unknown.length > 0 ? [`Unknown Dune module: ${unknown.map(String).join(', ')}`] : [];
}
