import {BoardName} from '@/common/boards/BoardName';
import {StatsGame, StatsTile} from '@/common/stats/StatsGame';
import {SpaceId} from '@/common/Types';

export type HeatmapTileType = StatsTile['type'];

/** How often each space was built on – across all games on this board with a known final state. */
export type Heatmap = {
  counts: Map<SpaceId, number>;
  /** Games the numbers come from (only those with a game state, screenshots show no board). */
  games: number;
  maximum: number;
};

export function heatmap(games: ReadonlyArray<StatsGame>, boardName: BoardName, type: HeatmapTileType, playerName: string | undefined): Heatmap {
  const counts = new Map<SpaceId, number>();
  let gameCount = 0;
  for (const game of games) {
    const tiles = game.details?.tiles;
    if (game.details?.boardName !== boardName || tiles === undefined) {
      continue;
    }
    gameCount++;
    for (const tile of tiles) {
      if (tile.type === type && (playerName === undefined || tile.playerName === playerName)) {
        counts.set(tile.spaceId, (counts.get(tile.spaceId) ?? 0) + 1);
      }
    }
  }
  return {counts, games: gameCount, maximum: Math.max(0, ...counts.values())};
}

/** Heatmap color steps: 10 steps of 10 percentage points, from dark blue (rare) to dark red (almost always). */
export const HEAT_STEPS = 10;

/** Step 1–10 for a share in percent: 1–10 % → 1, 91–100 % → 10. */
export function heatStep(percent: number): number {
  return Math.min(HEAT_STEPS, Math.max(1, Math.ceil(percent / 10)));
}
