import {PLAYABLE_DUNE_MODULES} from '../dune/DuneModule';

/**
 * Dune module IDs the support file may name; undefined: this branch has no Dune, the file's list is ignored.
 * Only playable modules: smuggling is merged into CHOAM and showed up as a second "CHOAM" in the admin overview.
 */
export const KNOWN_DUNE_MODULE_IDS: ReadonlyArray<string> | undefined = PLAYABLE_DUNE_MODULES;
