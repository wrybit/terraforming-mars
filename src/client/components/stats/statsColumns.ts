import {StatsColumn} from './statsTypes';
import {EntityStats} from './statsAggregate';
import {StatsKind} from './statsKinds';
import {formatLift, formatNumber, formatPercent} from './statsLabels';
import {StatsPlayerResult} from './statsResults';
import {averageCardPoints} from './statsSeries';

/** Row of the lists: key figures plus values only some kinds have. */
export type EntityRow = EntityStats & {
  /** Awards: share in which the funder also won it. */
  funderWinShare?: number;
  /** Cards: avg victory points the card yielded. */
  averageCardPoints?: number;
};

const COLUMNS: Record<string, StatsColumn> = {
  name: {key: 'name', label: 'Name', value: (row: EntityRow) => row.name, text: true},
  winRate: {key: 'winRate', label: 'Win rate', value: (row: EntityRow) => row.winRate},
  lift: {key: 'lift', label: 'vs. luck', value: (row: EntityRow) => row.winRate - row.expectedWinRate, format: (row: EntityRow) => formatLift(row.winRate, row.expectedWinRate)},
  plays: {key: 'plays', label: 'Played', value: (row: EntityRow) => row.plays},
  claimed: {key: 'plays', label: 'Claimed', value: (row: EntityRow) => row.plays},
  funded: {key: 'plays', label: 'Funded', value: (row: EntityRow) => row.plays},
  games: {key: 'games', label: 'Games', value: (row: EntityRow) => row.games},
  averagePoints: {key: 'averagePoints', label: 'Avg. points', value: (row: EntityRow) => row.averagePoints, format: (row: EntityRow) => formatNumber(row.averagePoints)},
  averagePlace: {key: 'averagePlace', label: 'Avg. place', value: (row: EntityRow) => row.averagePlace, format: (row: EntityRow) => formatNumber(row.averagePlace)},
  averageGeneration: {key: 'averageGeneration', label: 'Avg. generations', value: (row: EntityRow) => row.averageGeneration, format: (row: EntityRow) => formatNumber(row.averageGeneration)},
  averageCardPoints: {key: 'averageCardPoints', label: 'Avg. VP', value: (row: EntityRow) => row.averageCardPoints, format: (row: EntityRow) => formatNumber(row.averageCardPoints)},
  funderWinShare: {key: 'funderWinShare', label: 'Won by funder', value: (row: EntityRow) => row.funderWinShare, format: (row: EntityRow) => formatPercent(row.funderWinShare)},
  mostPlayedBy: {key: 'mostPlayedBy', label: 'Mostly by', value: (row: EntityRow) => row.mostPlayedBy, text: true},
  mostWinsBy: {key: 'mostWinsBy', label: 'Most wins', value: (row: EntityRow) => row.mostWinsBy, text: true},
};

const COLUMNS_BY_KIND: Record<Exclude<StatsKind, 'player'>, ReadonlyArray<string>> = {
  corporation: ['name', 'winRate', 'lift', 'plays', 'averagePoints', 'averagePlace', 'mostPlayedBy'],
  prelude: ['name', 'winRate', 'lift', 'plays', 'averagePoints', 'averagePlace', 'mostPlayedBy'],
  card: ['name', 'winRate', 'lift', 'plays', 'averageCardPoints', 'averagePoints', 'averagePlace', 'mostPlayedBy'],
  milestone: ['name', 'winRate', 'lift', 'claimed', 'averagePoints', 'mostPlayedBy'],
  award: ['name', 'winRate', 'lift', 'funded', 'funderWinShare', 'mostPlayedBy'],
  // A board belongs to all players of a game: win rate says nothing there, who wins there already does
  board: ['name', 'games', 'averageGeneration', 'averagePoints', 'mostWinsBy'],
};

export function entityColumns(kind: Exclude<StatsKind, 'player'>): Array<StatsColumn> {
  return COLUMNS_BY_KIND[kind].map((key) => COLUMNS[key]);
}

/** Short columns for the "played together" tables of the detail pages. */
export const COMPANION_COLUMNS: ReadonlyArray<StatsColumn> = [COLUMNS.name, COLUMNS.plays, COLUMNS.winRate];

export function initialSortOf(kind: StatsKind): string {
  return kind === 'board' ? 'games' : 'winRate';
}

/** Did the funder win the award themselves? (a shared first place counts too) */
export function withFunderWinShare(row: EntityStats, results: ReadonlyArray<StatsPlayerResult>): EntityRow {
  const funded = results.flatMap((result) => (result.game.details?.awards ?? [])
    .filter((award) => award.name === row.name && award.funderName === result.player.name));
  const won = funded.filter((award) => award.winnerNames.includes(award.funderName)).length;
  return {...row, funderWinShare: funded.length === 0 ? undefined : won / funded.length};
}

/** Victory points a card yielded on average (cards without points stay empty). */
export function withCardPoints(row: EntityRow, results: ReadonlyArray<StatsPlayerResult>): EntityRow {
  return {...row, averageCardPoints: averageCardPoints(results, row.name)};
}
