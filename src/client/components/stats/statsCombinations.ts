import {aggregate} from './statsAggregate';
import {StatsKind, STATS_KINDS} from './statsKinds';
import {expectedWinRate, StatsPlayerResult} from './statsResults';

export type CombinationKind = Extract<StatsKind, 'corporation' | 'prelude' | 'card'>;

/** Welche Paare es gibt (wie bei tfmstats): Konzern, Präludium und Projektkarte untereinander. */
export const COMBINATION_TYPES: ReadonlyArray<{key: string, first: CombinationKind, second: CombinationKind, label: string}> = [
  {key: 'corporation-prelude', first: 'corporation', second: 'prelude', label: 'Corporation + Prelude'},
  {key: 'corporation-card', first: 'corporation', second: 'card', label: 'Corporation + Card'},
  {key: 'prelude-prelude', first: 'prelude', second: 'prelude', label: 'Prelude + Prelude'},
  {key: 'prelude-card', first: 'prelude', second: 'card', label: 'Prelude + Card'},
  {key: 'card-card', first: 'card', second: 'card', label: 'Card + Card'},
];

export type CombinationStats = {
  first: string;
  second: string;
  plays: number;
  wins: number;
  winRate: number;
  /** Siegquote bei reinem Zufall (1 ÷ Spielerzahl), gemittelt über die Partien. */
  expectedWinRate: number;
  /** Mittel der beiden Einzel-Siegquoten: so gut wären die beiden ohne gegenseitige Wirkung. */
  baselineWinRate: number;
};

/** Alle Paare zweier Arten, die ein Spieler in derselben Partie hatte. */
export function combinations(results: ReadonlyArray<StatsPlayerResult>, first: CombinationKind, second: CombinationKind): Array<CombinationStats> {
  const single = (kind: CombinationKind) => new Map(aggregate(results, kind).map((entry) => [entry.name, entry.winRate]));
  const firstRates = single(first);
  const secondRates = first === second ? firstRates : single(second);
  const pairs = new Map<string, {first: string, second: string, plays: number, wins: number, expected: number}>();
  for (const result of results) {
    const firstNames = Array.from(new Set(STATS_KINDS[first].namesOf(result)));
    const secondNames = first === second ? firstNames : Array.from(new Set(STATS_KINDS[second].namesOf(result)));
    for (const firstName of firstNames) {
      for (const secondName of secondNames) {
        // Gleiche Art: jedes Paar nur einmal und nie mit sich selbst
        if (first === second && firstName >= secondName) {
          continue;
        }
        const key = `${firstName}\u0000${secondName}`;
        const entry = pairs.get(key) ?? {first: firstName, second: secondName, plays: 0, wins: 0, expected: 0};
        entry.plays++;
        entry.expected += expectedWinRate(result.game);
        if (result.place === 1) {
          entry.wins++;
        }
        pairs.set(key, entry);
      }
    }
  }
  return Array.from(pairs.values()).map((entry) => ({
    first: entry.first,
    second: entry.second,
    plays: entry.plays,
    wins: entry.wins,
    winRate: entry.wins / entry.plays,
    expectedWinRate: entry.expected / entry.plays,
    baselineWinRate: ((firstRates.get(entry.first) ?? 0) + (secondRates.get(entry.second) ?? 0)) / 2,
  }));
}
