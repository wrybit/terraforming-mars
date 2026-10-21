import {CITY_TILES, GREENERY_TILES, TileType} from '../TileType';

// What Shai-Hulud does to a space it crosses. The server applies it (server/dune/Worm.ts crossSpace), the client shows
// it as a chip on every space of the worm move (WormMoveInput.vue) – both read this file, so chip and effect agree.

/** Units a player loses for a trampled greenery (plants) or a damaged special tile (M€) */
export const WORM_LEVY_UNITS = 3;
/** Worm riders of a city: spice (titanium) and water (heat) for its owner */
export const WORM_RIDER_SPICE = 1;
export const WORM_RIDER_WATER = 2;
/** Spice blow: 1 spice for each adjacent tile of a player, at most this many in total */
export const SPICE_BLOW_MAX = 6;
/** Worm domain (Natural Preserve): TR for its owner, and the worm stops there */
export const WORM_DOMAIN_TR = 1;

export type WormEffectKind = 'spice-blow' | 'worm-riders' | 'trampled' | 'damaged' | 'domain' | 'none';

/** Effect of a crossed space by its tile; `owned`: a player owns the tile */
export function wormEffectKind(tileType: TileType | undefined, owned: boolean): WormEffectKind {
  if (tileType === undefined) {
    return 'none';
  }
  if (tileType === TileType.OCEAN) {
    return 'spice-blow';
  }
  if (!owned) {
    return 'none';
  }
  if (CITY_TILES.has(tileType)) {
    return 'worm-riders';
  }
  if (GREENERY_TILES.has(tileType)) {
    return 'trampled';
  }
  if (tileType === TileType.NATURAL_PRESERVE) {
    return 'domain';
  }
  return 'damaged';
}
