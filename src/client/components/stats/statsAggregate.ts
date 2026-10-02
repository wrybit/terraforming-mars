import {StatsKind, STATS_KINDS} from './statsKinds';
import {average, expectedWinRate, StatsPlayerResult} from './statsResults';

export type StatsPlayerShare = {
  name: string;
  plays: number;
  wins: number;
  /** Siegquote bei reinem Zufall, gemittelt über die Partien dieses Spielers. */
  expectedWinRate: number;
};

/** Kennzahlen eines Eintrags (Konzern, Karte, Spieler …) über alle Spieler-Partien, in denen er vorkam. */
export type EntityStats = {
  name: string;
  /** Spieler-Partien: ein Spielplan in einer Dreierpartie zählt dreimal, ein Konzern einmal. */
  plays: number;
  /** Verschiedene Partien. */
  games: number;
  wins: number;
  winRate: number;
  /** Siegquote bei reinem Zufall (1 ÷ Spielerzahl), gemittelt über die Partien. */
  expectedWinRate: number;
  averagePoints: number | undefined;
  averagePlace: number | undefined;
  averageGeneration: number | undefined;
  players: Array<StatsPlayerShare>;
  /** Wer den Eintrag am häufigsten hatte. */
  mostPlayedBy: string | undefined;
  /** Wer damit am häufigsten gewonnen hat. */
  mostWinsBy: string | undefined;
};

function toEntityStats(name: string, results: ReadonlyArray<StatsPlayerResult>): EntityStats {
  const wins = results.filter((result) => result.place === 1).length;
  const uniqueGames = Array.from(new Set(results.map((result) => result.game)));
  const shares = new Map<string, StatsPlayerShare>();
  for (const result of results) {
    const share = shares.get(result.player.name) ?? {name: result.player.name, plays: 0, wins: 0, expectedWinRate: 0};
    // Laufender Mittelwert, damit kein zweiter Durchlauf nötig ist
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

/** Gruppiert Spieler-Partien nach den Einträgen, die eine Art liefert. */
export function aggregate(results: ReadonlyArray<StatsPlayerResult>, kind: StatsKind): Array<EntityStats> {
  const groups = new Map<string, Array<StatsPlayerResult>>();
  for (const result of results) {
    // Doppelte Einträge (z. B. zwei gleiche Präludien) zählen je Partie nur einmal
    for (const name of new Set(STATS_KINDS[kind].namesOf(result))) {
      groups.set(name, [...(groups.get(name) ?? []), result]);
    }
  }
  return Array.from(groups.entries()).map(([name, group]) => toEntityStats(name, group));
}

/** Alle Spieler-Partien, in denen ein Eintrag vorkam. */
export function resultsWith(results: ReadonlyArray<StatsPlayerResult>, kind: StatsKind, name: string): Array<StatsPlayerResult> {
  return results.filter((result) => STATS_KINDS[kind].namesOf(result).includes(name));
}

export function entityStats(results: ReadonlyArray<StatsPlayerResult>, kind: StatsKind, name: string): EntityStats {
  return toEntityStats(name, resultsWith(results, kind, name));
}
