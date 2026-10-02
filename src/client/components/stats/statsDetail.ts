import {StatsGame} from '@/common/stats/StatsGame';
import {aggregate, EntityStats, resultsWith} from './statsAggregate';
import {COMPANION_KINDS, StatsKind} from './statsKinds';
import {StatsPlayerResult} from './statsResults';

export type PlayerCountStats = {
  playerCount: number;
  plays: number;
  wins: number;
};

export type HeadToHead = {
  opponent: string;
  /** Gemeinsame Partien, in denen der Spieler vor dem Gegner lag … */
  ahead: number;
  /** … und dahinter (gleicher Platz zählt nirgends). */
  behind: number;
};

/** Alles für die Detailseite eines Eintrags. */
export type EntityDetail = {
  results: Array<StatsPlayerResult>;
  byPlayerCount: Array<PlayerCountStats>;
  /** Was in denselben Spieler-Partien sonst noch gespielt wurde, je Art. */
  companions: Array<{kind: StatsKind, entries: Array<EntityStats>}>;
};

export function entityDetail(allResults: ReadonlyArray<StatsPlayerResult>, kind: StatsKind, name: string): EntityDetail {
  const results = resultsWith(allResults, kind, name);
  const counts = new Map<number, PlayerCountStats>();
  for (const result of results) {
    const playerCount = result.game.summary.players.length;
    const entry = counts.get(playerCount) ?? {playerCount, plays: 0, wins: 0};
    entry.plays++;
    if (result.place === 1) {
      entry.wins++;
    }
    counts.set(playerCount, entry);
  }
  return {
    results: [...results].sort((first, second) => second.game.summary.createdTimeMs - first.game.summary.createdTimeMs),
    byPlayerCount: Array.from(counts.values()).sort((first, second) => first.playerCount - second.playerCount),
    companions: COMPANION_KINDS[kind].map((companionKind) => ({
      kind: companionKind,
      entries: aggregate(results, companionKind).filter((entry) => entry.name !== name),
    })),
  };
}

function placeIn(game: StatsGame, results: ReadonlyArray<StatsPlayerResult>, name: string): number | undefined {
  return results.find((result) => result.game === game && result.player.name === name)?.place;
}

/** Direktvergleich: in gemeinsamen Partien, wie oft lag der Spieler vor bzw. hinter jedem anderen. */
export function headToHead(allResults: ReadonlyArray<StatsPlayerResult>, name: string): Array<HeadToHead> {
  const own = allResults.filter((result) => result.player.name === name);
  const opponents = new Map<string, HeadToHead>();
  for (const result of own) {
    for (const other of result.game.summary.players.filter((player) => player.name !== name)) {
      const entry = opponents.get(other.name) ?? {opponent: other.name, ahead: 0, behind: 0};
      const otherPlace = placeIn(result.game, allResults, other.name);
      if (otherPlace !== undefined && result.place < otherPlace) {
        entry.ahead++;
      } else if (otherPlace !== undefined && result.place > otherPlace) {
        entry.behind++;
      }
      opponents.set(other.name, entry);
    }
  }
  return Array.from(opponents.values()).sort((first, second) => (second.ahead + second.behind) - (first.ahead + first.behind));
}
