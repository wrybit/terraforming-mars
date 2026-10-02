import {StatsGame} from '@/common/stats/StatsGame';
import {StatsPlayerResult} from './statsResults';
import {formatDuration} from './statsLabels';

export type StatsRecordEntry = {
  result: StatsPlayerResult;
  value: number;
};

export type StatsRecord = {
  /** Englisch, wird beim Anzeigen übersetzt. */
  title: string;
  unit: string;
  entries: Array<StatsRecordEntry>;
  /** Anzeige des Werts, wenn er keine einfache Zahl ist (z. B. Zeit). */
  format?: (value: number) => string;
};

const RECORD_SIZE = 5;

/** Vorsprung des Siegers auf den Zweiten. */
function winningMargin(result: StatsPlayerResult): number | undefined {
  if (result.place !== 1) {
    return undefined;
  }
  const others = result.game.summary.players.filter((player) => player !== result.player).map((player) => player.victoryPoints);
  return others.length === 0 ? undefined : result.player.victoryPoints - Math.max(...others);
}

function topEntries(results: ReadonlyArray<StatsPlayerResult>, valueOf: (result: StatsPlayerResult) => number | undefined, ascending = false): Array<StatsRecordEntry> {
  return results
    .map((result) => ({result, value: valueOf(result)}))
    .filter((entry): entry is StatsRecordEntry => entry.value !== undefined)
    .sort((first, second) => ascending ? first.value - second.value : second.value - first.value)
    .slice(0, RECORD_SIZE);
}

export function statsRecords(results: ReadonlyArray<StatsPlayerResult>): Array<StatsRecord> {
  const winners = results.filter((result) => result.place === 1);
  return [
    {title: 'Highest score', unit: 'VP', entries: topEntries(results, (result) => result.player.victoryPoints)},
    {title: 'Biggest winning margin', unit: 'VP', entries: topEntries(results, winningMargin)},
    {title: 'Highest terraform rating', unit: 'TR', entries: topEntries(results, (result) => result.details?.terraformRating)},
    {title: 'Most greeneries', unit: '', entries: topEntries(results, (result) => result.details?.greeneries)},
    {title: 'Most cities', unit: '', entries: topEntries(results, (result) => result.details?.cities)},
    {title: 'Most victory points from cards', unit: 'VP', entries: topEntries(results, (result) => result.details?.victoryPoints?.cards)},
    {title: 'Most milestone and award points', unit: 'VP', entries: topEntries(results, (result) => {
      const points = result.details?.victoryPoints;
      return points === undefined ? undefined : points.milestones + points.awards;
    })},
    // Vollständige Kartenliste gibt es nur mit Spielstand – Screenshots zeigen nur Karten mit Punkten
    {title: 'Most cards played', unit: '', entries: topEntries(results, (result) => result.game.details?.cardsComplete === true ? result.details?.cards.length : undefined)},
    {title: 'Most actions', unit: '', entries: topEntries(results, (result) => result.details?.actions)},
    {title: 'Longest thinking time', unit: '', entries: topEntries(results, (result) => result.details?.timeSeconds), format: formatDuration},
    // Generation 0 = unbekannt (Screenshots aus anderen Versionen)
    {title: 'Shortest games', unit: 'Gen', entries: topEntries(winners, (result) => result.game.summary.generation || undefined, true)},
  ].filter((record) => record.entries.length > 0);
}

/** Partien je Generationenzahl, für das Balkendiagramm der Übersicht. */
export function gamesByGeneration(games: ReadonlyArray<StatsGame>): Array<{generation: number, games: number}> {
  const known = games.map((game) => game.summary.generation).filter((generation) => generation > 0);
  if (known.length === 0) {
    return [];
  }
  const entries = [];
  for (let generation = Math.min(...known); generation <= Math.max(...known); generation++) {
    entries.push({generation, games: known.filter((candidate) => candidate === generation).length});
  }
  return entries;
}
