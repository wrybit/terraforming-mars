import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

// The games overview splits the games into three tables: running with players at the screen (do not delete!),
// running without anyone online, and finished ones
export type GameGroupKey = 'live' | 'open' | 'finished';

export type GameGroup = {
  key: GameGroupKey,
  title: string,
  games: Array<AdminGameSummary>,
};

const GAME_GROUP_TITLES: ReadonlyArray<{key: GameGroupKey, title: string}> = [
  {key: 'live', title: 'Open games with players online'},
  {key: 'open', title: 'Open games'},
  {key: 'finished', title: 'Finished games'},
];

export function gameGroupOf(summary: AdminGameSummary): GameGroupKey {
  if (summary.isFinished) {
    return 'finished';
  }
  return summary.players.some((player) => player.isOnline === true) ? 'live' : 'open';
}

/** The non-empty groups in fixed order; the order of the games within a group is kept. */
export function groupGames(summaries: ReadonlyArray<AdminGameSummary>): Array<GameGroup> {
  return GAME_GROUP_TITLES
    .map(({key, title}) => ({key, title, games: summaries.filter((summary) => gameGroupOf(summary) === key)}))
    .filter((group) => group.games.length > 0);
}
