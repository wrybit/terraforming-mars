// Kanly (Dune module F): who holds the war field at the end of the generation. One rule for server (resolveBattle in
// server/dune/Kanly.ts) and client (the forecast in the Kanly tab and when sending Sardaukar), so both say the same.

import {HAZARD_TILES, TileType} from '../TileType';

/**
 * Tiles a Kanly may be opened on (when they belong to another player): greenery, city or special tile – not an ocean,
 * not a natural preserve, not a hazard. One rule for the server (battleTargets) and the client (why the button is off).
 */
export function isKanlyTargetTile(tileType: TileType): boolean {
  return tileType !== TileType.OCEAN && tileType !== TileType.NATURAL_PRESERVE && !HAZARD_TILES.has(tileType);
}

/** Opening a Kanly costs M€ (Solari) on top of the Sardaukar (Jens, 19 Oct 2026); the client shows it on the button */
export const OPEN_KANLY_COST = 8;

export type BattleForce<K> = {key: K, sardaukar: number};

/**
 * The challenger that takes the tile, or undefined when the owner keeps it: a challenger needs more Sardaukar than the
 * owner and than every other challenger; any tie leaves the tile with the owner.
 */
export function battleWinner<K>(owner: K, forces: ReadonlyArray<BattleForce<K>>): K | undefined {
  let most = forces.find((force) => force.key === owner)?.sardaukar ?? 0;
  let winner: K | undefined;
  let tie = false;
  for (const force of forces) {
    if (force.key === owner) {
      continue;
    }
    if (force.sardaukar > most) {
      winner = force.key;
      most = force.sardaukar;
      tie = false;
    } else if (force.sardaukar === most && winner !== undefined) {
      tie = true;
    }
  }
  return tie ? undefined : winner;
}
