import {StatsGame, StatsPlayerDetails} from '@/common/stats/StatsGame';
import {AdminPlayerSummary} from '@/common/admin/AdminGameSummary';
import {Color} from '@/common/Color';
import {lineupKey} from '@/client/components/admin/winCounts';

/** A player in a game – the unit by which almost all metrics are counted. */
export type StatsPlayerResult = {
  game: StatsGame;
  player: AdminPlayerSummary;
  /** 1 = winner; on a tie players share the place. */
  place: number;
  details: StatsPlayerDetails | undefined;
};

/** Placement as in the game: victory points, on a tie M€. */
function placeOf(player: AdminPlayerSummary, players: ReadonlyArray<AdminPlayerSummary>): number {
  if (player.isWinner) {
    return 1;
  }
  const ahead = players.filter((other) => other.victoryPoints > player.victoryPoints ||
    (other.victoryPoints === player.victoryPoints && other.megaCredits > player.megaCredits));
  return ahead.length + 1;
}

export function playerResults(game: StatsGame): Array<StatsPlayerResult> {
  return game.summary.players.map((player) => ({
    game,
    player,
    place: placeOf(player, game.summary.players),
    details: game.details?.players.find((details) => details.name === player.name),
  }));
}

export function allPlayerResults(games: ReadonlyArray<StatsGame>): Array<StatsPlayerResult> {
  return games.flatMap(playerResults);
}

/** Same notation as the winner statistics of the admin overview (winCounts.ts), so both match. */
export function lineupOf(game: StatsGame): string {
  return Array.from(new Set(game.summary.players.map((player) => player.name)))
    .sort((first, second) => first.localeCompare(second))
    .join(' vs ');
}

export function yearOf(game: StatsGame): string {
  return String(new Date(game.summary.createdTimeMs).getFullYear());
}

/** Probability of winning if everyone were equally good. */
export function expectedWinRate(game: StatsGame): number {
  return 1 / Math.max(1, game.summary.players.length);
}

export function winnerOf(game: StatsGame): AdminPlayerSummary | undefined {
  return game.summary.players.find((player) => player.isWinner);
}

/** Player names, most frequently participating first. */
export function playerNames(games: ReadonlyArray<StatsGame>): Array<string> {
  const counts = new Map<string, number>();
  for (const result of allPlayerResults(games)) {
    counts.set(result.player.name, (counts.get(result.player.name) ?? 0) + 1);
  }
  return Array.from(counts.keys()).sort((first, second) => (counts.get(second) ?? 0) - (counts.get(first) ?? 0) || first.localeCompare(second));
}

/** Color a player played most often – so you recognize them everywhere in the statistics. */
export function playerColors(games: ReadonlyArray<StatsGame>): Map<string, Color> {
  const counts = new Map<string, Map<Color, number>>();
  for (const {player} of allPlayerResults(games)) {
    const byColor = counts.get(player.name) ?? new Map<Color, number>();
    byColor.set(player.color, (byColor.get(player.color) ?? 0) + 1);
    counts.set(player.name, byColor);
  }
  const colors = new Map<string, Color>();
  counts.forEach((byColor, name) => {
    const [color] = Array.from(byColor.entries()).sort((first, second) => second[1] - first[1])[0];
    colors.set(name, color);
  });
  return colors;
}

export function average(values: ReadonlyArray<number>): number | undefined {
  return values.length === 0 ? undefined : values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Thinking time of all players added up – only when it is known for every player, a partial sum would mislead. */
export function totalTimeSeconds(game: StatsGame): number | undefined {
  const players = game.details?.players ?? [];
  if (players.length === 0 || players.some((player) => player.timeSeconds === undefined)) {
    return undefined;
  }
  return players.reduce((sum, player) => sum + (player.timeSeconds ?? 0), 0);
}

/** Avg. game length per line-up – only finished games whose total time is known. */
export function averageTimeByLineup(games: ReadonlyArray<StatsGame>): Map<string, number | undefined> {
  const times = new Map<string, Array<number>>();
  for (const game of games.filter((candidate) => candidate.summary.isFinished)) {
    const key = lineupKey(game.summary);
    const seconds = totalTimeSeconds(game);
    const list = times.get(key) ?? [];
    if (seconds !== undefined) {
      list.push(seconds);
    }
    times.set(key, list);
  }
  return new Map(Array.from(times.entries()).map(([key, list]) => [key, average(list)]));
}
