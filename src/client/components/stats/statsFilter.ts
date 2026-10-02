import {StatsGame} from '@/common/stats/StatsGame';
import {EXPANSION_OPTIONS, FilterOption, optionKeys} from '@/client/components/cardlist/cardListOptions';
import {markedOptions, Selection} from '@/client/components/cardlist/filterSelection';
import {lineupOf, yearOf} from './statsResults';
import {boardLabel} from './statsLabels';

// Filter der Statistik. Gleiche Auswahl-Logik und Kacheln wie in der Kartenliste (filterSelection.ts,
// CardListFilterGroup.vue): nichts markiert = alles; der erste Klick grenzt ein.
export type StatsFilterKey = 'lineup' | 'board' | 'expansion' | 'year';

export type StatsFilterGroup = {
  key: StatsFilterKey;
  title: string;
  options: ReadonlyArray<FilterOption>;
};

export type StatsFilters = {
  selections: Record<StatsFilterKey, Selection<string>>;
  /** Höchstens so viele Generationen; undefined = keine Grenze. */
  maxGeneration: number | undefined;
};

export const FILTER_KEYS: ReadonlyArray<StatsFilterKey> = ['lineup', 'board', 'expansion', 'year'];

function distinct(values: ReadonlyArray<string>): Array<string> {
  return Array.from(new Set(values)).sort((first, second) => first.localeCompare(second));
}

/** Optionen ergeben sich aus den vorhandenen Partien – es gibt nichts zu wählen, was nie gespielt wurde. */
export function filterGroups(games: ReadonlyArray<StatsGame>): Array<StatsFilterGroup> {
  const expansions = new Set<string>(games.flatMap((game) => game.details?.expansions ?? []));
  return [
    {key: 'lineup', title: 'Lineup', options: distinct(games.map(lineupOf)).map((lineup) => ({key: lineup, label: lineup}))},
    {key: 'board', title: 'Board', options: distinct(games.flatMap((game) => game.details === undefined ? [] : [game.details.boardName]))
      .map((board) => ({key: board, label: boardLabel(board)}))},
    {key: 'expansion', title: 'Expansions', options: EXPANSION_OPTIONS.filter((option) => expansions.has(option.key))},
    {key: 'year', title: 'Year', options: distinct(games.map(yearOf)).map((year) => ({key: year, label: year}))},
  ];
}

export function emptyFilters(groups: ReadonlyArray<StatsFilterGroup>): StatsFilters {
  // Jede Gruppe ist immer da (auch bevor die Partien geladen sind), alle Optionen eingeschlossen = kein Filter
  const selections: Record<StatsFilterKey, Selection<string>> = {lineup: {}, board: {}, expansion: {}, year: {}};
  for (const group of groups) {
    selections[group.key] = Object.fromEntries(optionKeys(group.options).map((key) => [key, true]));
  }
  return {selections, maxGeneration: undefined};
}

export function matchesOption(game: StatsGame, key: StatsFilterKey, marked: ReadonlyArray<string>): boolean {
  if (marked.length === 0) {
    return true;
  }
  switch (key) {
  case 'lineup':
    return marked.includes(lineupOf(game));
  case 'year':
    return marked.includes(yearOf(game));
  // Ohne Endstand ist Spielplan/Erweiterung unbekannt: solche Partien fallen bei diesen Filtern heraus
  case 'board':
    return game.details !== undefined && marked.includes(game.details.boardName);
  case 'expansion': {
    const expansions: ReadonlyArray<string> = game.details?.expansions ?? [];
    return game.details !== undefined && marked.every((expansion) => expansions.includes(expansion));
  }
  }
}

export function markedOf(filters: StatsFilters, key: StatsFilterKey): Array<string> {
  return markedOptions(filters.selections[key], Object.keys(filters.selections[key]));
}

/** skipKey: diese Gruppe nicht anwenden – für die Trefferzahlen an ihren eigenen Optionen. */
export function filterGames(games: ReadonlyArray<StatsGame>, filters: StatsFilters, skipKey?: StatsFilterKey): Array<StatsGame> {
  return games.filter((game) =>
    (filters.maxGeneration === undefined || game.summary.generation <= filters.maxGeneration) &&
    FILTER_KEYS.every((key) => key === skipKey || matchesOption(game, key, markedOf(filters, key))));
}

/** Trefferzahl je Option, wenn man sie (zu den übrigen Filtern) wählt. */
export function optionCounts(games: ReadonlyArray<StatsGame>, filters: StatsFilters, group: StatsFilterGroup): Map<string, number> {
  const base = filterGames(games, filters, group.key);
  return new Map(group.options.map((option) => [option.key, base.filter((game) => matchesOption(game, group.key, [option.key])).length]));
}

export function activeFilterCount(filters: StatsFilters): number {
  return FILTER_KEYS.reduce((sum, key) => sum + markedOf(filters, key).length, 0) + (filters.maxGeneration === undefined ? 0 : 1);
}
