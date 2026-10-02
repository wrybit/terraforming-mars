import {BoardName} from '@/common/boards/BoardName';
import {StatsGame, StatsTile} from '@/common/stats/StatsGame';
import {SpaceId} from '@/common/Types';

export type HeatmapTileType = StatsTile['type'];

/** Wie oft auf jedes Feld gebaut wurde – über alle Partien auf diesem Spielbrett mit bekanntem Endstand. */
export type Heatmap = {
  counts: Map<SpaceId, number>;
  /** Partien, aus denen die Zahlen stammen (nur solche mit Spielstand, Screenshots zeigen kein Brett). */
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
