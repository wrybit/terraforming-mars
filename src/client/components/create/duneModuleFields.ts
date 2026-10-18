import {DuneModule, DUNE_MODULES, DUNE_MODULE_LABEL, PLAYABLE_DUNE_MODULES} from '@/common/dune/DuneModule';

// Dune expansion in the create-game form: one switch per module (CreateGameModel), so saved settings, files and
// share links keep each module on its own. The game config carries the list (NewGameConfig.duneModules).
export const DUNE_MODULE_FIELD = {
  bazaar: 'duneBazaar',
  worm: 'duneWorm',
  kanly: 'duneKanly',
  schemes: 'duneSchemes',
  choam: 'duneChoam',
  smuggling: 'duneSmuggling',
} as const satisfies Record<DuneModule, string>;

export type DuneModuleField = typeof DUNE_MODULE_FIELD[DuneModule];
export type DuneModuleSwitches = Record<DuneModuleField, boolean>;

/** Detail line of the module chip (English, translated on display) */
export const DUNE_MODULE_DETAIL: Record<DuneModule, string> = {
  bazaar: '32 wares · bazaar phase',
  worm: 'Worm marker · end of generation',
  kanly: 'Sardaukar · one battle per generation',
  schemes: '24 secret agendas · 3/5/8 VP',
  choam: 'Trade between players',
  smuggling: 'Spice for M€ · suspicion track',
};

/** Icon of the module chip (assets/themes/dune/graphics) */
export const DUNE_MODULE_ICON: Record<DuneModule, string> = {
  bazaar: 'special-bazaar',
  worm: 'special-worm-domain',
  kanly: 'res-sardaukar',
  schemes: 'res-advisor',
  choam: 'coin',
  smuggling: 'special-smugglers-market',
};

export function chosenDuneModules(switches: DuneModuleSwitches): Array<DuneModule> {
  return DUNE_MODULES.filter((module) => switches[DUNE_MODULE_FIELD[module]] && PLAYABLE_DUNE_MODULES.includes(module));
}

export {DUNE_MODULE_LABEL, PLAYABLE_DUNE_MODULES};
