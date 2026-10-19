// Kanly (Dune module F): who holds the war field at the end of the generation. One rule for server (resolveBattle in
// server/dune/Kanly.ts) and client (the forecast in the Kanly tab and when sending Sardaukar), so both say the same.

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
