import {MilestoneName} from '../ma/MilestoneName';
import {AwardName} from '../ma/AwardName';
import {DuneModule} from './DuneModule';
import {DUNE_AWARDS, DUNE_MILESTONES} from '../theme/Theme';

// Milestones and awards of a Dune game (Jens, 22 Oct 2026). Arrakis itself offers the Tharsis set under Dune names
// (DUNE_MILESTONES, DUNE_AWARDS). The goals of the mockup (tm.baiz.org/terraforming-dune/ziele.html) live in their
// own module of the Dune expansion ('goals'); every other module brings one milestone that fits it. With random
// milestones and awards a Dune game draws only from these, never from the Mars ones without Dune names.
// Where the mockup took an existing rule ("model"), the game uses that Mars milestone or award under its Dune name.

/** Goals module: the mockup's milestones beyond the board (Sietch Elder, Dew Catcher, Guild Friend, …) */
export const DUNE_GOALS_MILESTONES: ReadonlyArray<MilestoneName> = [
  'Geologist', 'Energizer', 'T. Spacefarer', 'Spice Lord', 'Legend', 'Ecologist', 'Polar Explorer',
];

/** Goals module: the mockup's awards beyond the board (Desert Ecologist, Lord of the Erg, …) */
export const DUNE_GOALS_AWARDS: ReadonlyArray<AwardName> = [
  'A. Zoologist', 'Desert Settler', 'Investor', 'Windtrap Magnate', 'Benefactor', 'Industrialist', 'Excentric',
];

/** One milestone per rules module, only in play with that module */
export const DUNE_MODULE_MILESTONES: Readonly<Record<Exclude<DuneModule, 'goals'>, MilestoneName>> = {
  bazaar: 'Bazaar Regular',
  worm: 'Sandwalker',
  kanly: 'Sardaukar Commander',
  schemes: 'Schemer',
  choam: 'CHOAM Partner',
  smuggling: 'Smuggler King',
};

/** Milestones and awards made for Dune only: Mars never offers them */
export const DUNE_ONLY_MILESTONES: ReadonlyArray<MilestoneName> = ['Spice Lord', ...Object.values(DUNE_MODULE_MILESTONES)];
export const DUNE_ONLY_AWARDS: ReadonlyArray<AwardName> = ['Windtrap Magnate'];

/** Every milestone a Dune game can show (card list, theme texts) */
export const ALL_DUNE_MILESTONES: ReadonlyArray<MilestoneName> = [...DUNE_MILESTONES, ...DUNE_GOALS_MILESTONES, ...Object.values(DUNE_MODULE_MILESTONES)];
export const ALL_DUNE_AWARDS: ReadonlyArray<AwardName> = [...DUNE_AWARDS, ...DUNE_GOALS_AWARDS];

/** Milestones a random draw of a Dune game picks from: the board's, the goals module's, those of the modules in play */
export function duneMilestoneCandidates(modules: ReadonlyArray<DuneModule>): Array<MilestoneName> {
  const fromModules = modules.filter((module): module is Exclude<DuneModule, 'goals'> => module !== 'goals')
    .map((module) => DUNE_MODULE_MILESTONES[module]);
  return [...DUNE_MILESTONES, ...(modules.includes('goals') ? DUNE_GOALS_MILESTONES : []), ...fromModules];
}

/** Awards a random draw of a Dune game picks from */
export function duneAwardCandidates(modules: ReadonlyArray<DuneModule>): Array<AwardName> {
  return [...DUNE_AWARDS, ...(modules.includes('goals') ? DUNE_GOALS_AWARDS : [])];
}
