import {StatsGame} from '@/common/stats/StatsGame';
import {aggregate, EntityStats, resultsWith} from './statsAggregate';
import {COMPANION_KINDS, StatsKind} from './statsKinds';
import {expectedWinRate, StatsPlayerResult} from './statsResults';
import {StatsBar} from './statsTypes';

export type PlayerCountStats = {
  playerCount: number;
  plays: number;
  wins: number;
  expectedWinRate: number;
};

export type HeadToHead = {
  opponent: string;
  /** Shared games in which the player finished ahead of the opponent … */
  ahead: number;
  /** … and behind (a tie counts nowhere). */
  behind: number;
};

/** Everything for an entry's detail page. */
export type EntityDetail = {
  results: Array<StatsPlayerResult>;
  byPlayerCount: Array<PlayerCountStats>;
  /** What else was played in the same player games, per kind. */
  companions: Array<{kind: StatsKind, entries: Array<EntityStats>}>;
};

export function entityDetail(allResults: ReadonlyArray<StatsPlayerResult>, kind: StatsKind, name: string): EntityDetail {
  const results = resultsWith(allResults, kind, name);
  const counts = new Map<number, PlayerCountStats>();
  for (const result of results) {
    const playerCount = result.game.summary.players.length;
    const entry = counts.get(playerCount) ?? {playerCount, plays: 0, wins: 0, expectedWinRate: expectedWinRate(result.game)};
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

/** Head-to-head: in shared games, how often the player finished ahead of or behind each other player. */
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

/**
 * Distribution as gapless bars (empty buckets stay visible), with the wins highlighted.
 * bucketSize 1 → one bar per value (generations), 10 → buckets of ten (points).
 */
export function histogram(results: ReadonlyArray<StatsPlayerResult>, valueOf: (result: StatsPlayerResult) => number | undefined, bucketSize: number): Array<StatsBar> {
  const buckets = new Map<number, {value: number, highlight: number}>();
  for (const result of results) {
    const value = valueOf(result);
    if (value === undefined || value <= 0) {
      continue;
    }
    const bucket = Math.floor(value / bucketSize) * bucketSize;
    const entry = buckets.get(bucket) ?? {value: 0, highlight: 0};
    entry.value++;
    if (result.place === 1) {
      entry.highlight++;
    }
    buckets.set(bucket, entry);
  }
  const keys = Array.from(buckets.keys());
  if (keys.length === 0) {
    return [];
  }
  const bars: Array<StatsBar> = [];
  for (let bucket = Math.min(...keys); bucket <= Math.max(...keys); bucket += bucketSize) {
    const entry = buckets.get(bucket) ?? {value: 0, highlight: 0};
    const range = bucketSize === 1 ? String(bucket) : `${bucket}–${bucket + bucketSize - 1}`;
    bars.push({label: String(bucket), value: entry.value, highlight: entry.highlight, title: `${range}: ${entry.highlight} / ${entry.value}`});
  }
  return bars;
}
