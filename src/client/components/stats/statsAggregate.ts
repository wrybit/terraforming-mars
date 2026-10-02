import {StatsKind, STATS_KINDS} from './statsKinds';
import {average, expectedWinRate, StatsPlayerResult} from './statsResults';

export type StatsPlayerShare = {
  name: string;
  plays: number;
  wins: number;
  /** Win rate by pure chance, averaged over this player's games. */
  expectedWinRate: number;
};

/** Metrics of an entry (corporation, card, player …) across all player-games in which it appeared. */
export type EntityStats = {
  name: string;
  /** Player-games: a board in a three-player game counts three times, a corporation once. */
  plays: number;
  /** Distinct games. */
  games: number;
  wins: number;
  winRate: number;
  /** Win rate by pure chance (1 ÷ player count), averaged over the games. */
  expectedWinRate: number;
  averagePoints: number | undefined;
  averagePlace: number | undefined;
  averageGeneration: number | undefined;
  players: Array<StatsPlayerShare>;
  /** Who had the entry most often. */
  mostPlayedBy: string | undefined;
  /** Who won with it most often. */
  mostWinsBy: string | undefined;
};

function toEntityStats(name: string, results: ReadonlyArray<StatsPlayerResult>): EntityStats {
  const wins = results.filter((result) => result.place === 1).length;
  const uniqueGames = Array.from(new Set(results.map((result) => result.game)));
  const shares = new Map<string, StatsPlayerShare>();
  for (const result of results) {
    const share = shares.get(result.player.name) ?? {name: result.player.name, plays: 0, wins: 0, expectedWinRate: 0};
    // Running average, so no second pass is needed
    share.expectedWinRate += (expectedWinRate(result.game) - share.expectedWinRate) / (share.plays + 1);
    share.plays++;
    if (result.place === 1) {
      share.wins++;
    }
    shares.set(result.player.name, share);
  }
  const players = Array.from(shares.values()).sort((first, second) => second.plays - first.plays || second.wins - first.wins);
  const byWins = [...players].sort((first, second) => second.wins - first.wins);
  return {
    name,
    plays: results.length,
    games: uniqueGames.length,
    wins,
    winRate: results.length === 0 ? 0 : wins / results.length,
    expectedWinRate: average(results.map((result) => expectedWinRate(result.game))) ?? 0,
    averagePoints: average(results.map((result) => result.player.victoryPoints)),
    averagePlace: average(results.map((result) => result.place)),
    averageGeneration: average(uniqueGames.map((game) => game.summary.generation).filter((generation) => generation > 0)),
    players,
    mostPlayedBy: players[0]?.name,
    mostWinsBy: byWins[0]?.wins > 0 ? byWins[0].name : undefined,
  };
}

/** Groups player-games by the entries a kind provides. */
export function aggregate(results: ReadonlyArray<StatsPlayerResult>, kind: StatsKind): Array<EntityStats> {
  const groups = new Map<string, Array<StatsPlayerResult>>();
  for (const result of results) {
    // Duplicate entries (e.g. two identical preludes) count only once per game
    for (const name of new Set(STATS_KINDS[kind].namesOf(result))) {
      groups.set(name, [...(groups.get(name) ?? []), result]);
    }
  }
  return Array.from(groups.entries()).map(([name, group]) => toEntityStats(name, group));
}

/** All player-games in which an entry appeared. */
export function resultsWith(results: ReadonlyArray<StatsPlayerResult>, kind: StatsKind, name: string): Array<StatsPlayerResult> {
  return results.filter((result) => STATS_KINDS[kind].namesOf(result).includes(name));
}

export function entityStats(results: ReadonlyArray<StatsPlayerResult>, kind: StatsKind, name: string): EntityStats {
  return toEntityStats(name, resultsWith(results, kind, name));
}

/** The most played entries of a kind (on a tie, those with the higher win rate first). */
export function mostPlayed(results: ReadonlyArray<StatsPlayerResult>, kind: StatsKind, count: number): Array<EntityStats> {
  return aggregate(results, kind)
    .sort((first, second) => second.plays - first.plays || second.winRate - first.winRate)
    .slice(0, count);
}
