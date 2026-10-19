import {SpaceId} from '../Types';

/**
 * Where the worm may start, chosen at random: E5, F4, F5, G3, G4, H3, H4 (Jens, 19 Oct 2026). Some lie behind the worm
 * border – the worm leaves its nest from there and never comes back. Shared by the server (dune/Worm.ts) and the rule
 * line of the Shai-Hulud tab (WormPanel.vue), so both name the same spaces.
 */
export const WORM_START_SPACES: ReadonlyArray<SpaceId> = ['33', '41', '42', '48', '49', '55', '56'] as Array<SpaceId>;
