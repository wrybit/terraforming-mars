import {IGameLoader} from '../database/IGameLoader';
import {IGame} from '../IGame';
import {Phase} from '../../common/Phase';
import {paths} from '../../common/app/paths';
import {AdminGameSummary} from '../../common/admin/AdminGameSummary';
import {StatsGame} from '../../common/stats/StatsGame';
import {localGameSummary} from '../admin/localGameSummary';
import {ImportedGamesStore} from '../admin/ImportedGamesStore';
import {ImportedSnapshotsStore} from '../admin/ImportedSnapshotsStore';
import {Server} from '../models/ServerModel';
import {statsGameDetails} from './statsGameDetails';
import {resolveCardName} from './cardNameResolver';
import {ScreenshotDetailsStore} from './ScreenshotDetailsStore';
import {withScreenshotSetup} from './screenshotSetup';
import {CardName} from '../../common/cards/CardName';
import {StatsGameDetails} from '../../common/stats/StatsGame';

// Finished games no longer change: once evaluated, they stay in memory.
// Saves building the complete final states on every statistics request.
const finishedLocalGames = new Map<string, StatsGame>();
/** Finished games without a human player; they never count. */
const aiOnlyGames = new Set<string>();

/** Corporations under their English card name; unknown ones (e.g. "Steam-Version") are dropped. */
function canonicalCorporations(corporation: string | undefined): string | undefined {
  const names = (corporation ?? '').split(' / ')
    .map(resolveCardName)
    .filter((name) => name !== undefined);
  return names.length === 0 ? undefined : names.join(' / ');
}

/** The statistics page is public: player and spectator links do not belong there. */
function publicSummary(summary: AdminGameSummary): AdminGameSummary {
  return {
    ...summary,
    spectatorUrl: undefined,
    players: summary.players.map((player) => ({...player, url: undefined, corporation: canonicalCorporations(player.corporation)})),
  };
}

function localStatsGame(game: IGame): StatsGame {
  return {
    summary: publicSummary(localGameSummary(game)),
    resultUrl: `${paths.THE_END}?id=${game.playersInGenerationOrder[0].id}`,
    details: statsGameDetails(Server.getSpectatorModel(game)),
  };
}

/** Sanitize card names read from screenshots: unknown ones are dropped instead of skewing the statistics. */
function knownCards(details: StatsGameDetails): StatsGameDetails {
  const known = (name: string): name is CardName => resolveCardName(name) === name;
  return {
    ...details,
    players: details.players.map((player) => ({
      ...player,
      cards: player.cards.filter(known),
      cardPoints: player.cardPoints?.filter((card) => known(card.name)),
    })),
  };
}

function screenshotIdOf(summary: AdminGameSummary): string | undefined {
  return summary.screenshotUrl === undefined ? undefined : new URLSearchParams(summary.screenshotUrl.split('?')[1] ?? '').get('id') ?? undefined;
}

function importedDetails(summary: AdminGameSummary, snapshots: ImportedSnapshotsStore, screenshots: ScreenshotDetailsStore): StatsGameDetails | undefined {
  const snapshot = summary.importedParticipantId === undefined ? undefined : snapshots.get(summary.importedParticipantId);
  if (snapshot !== undefined) {
    return statsGameDetails(snapshot.view);
  }
  const screenshotId = screenshotIdOf(summary);
  const fromScreenshot = screenshotId === undefined ? undefined : screenshots.get(screenshotId);
  if (fromScreenshot === undefined) {
    return undefined;
  }
  const corporations = summary.players.flatMap((player) => (canonicalCorporations(player.corporation) ?? '').split(' / '))
    .filter((name): name is CardName => name !== '');
  return withScreenshotSetup(knownCards(fromScreenshot.details), corporations);
}

function importedStatsGame(summary: AdminGameSummary, snapshots: ImportedSnapshotsStore, screenshots: ScreenshotDetailsStore): StatsGame {
  return {
    summary: publicSummary(summary),
    resultUrl: summary.screenshotUrl ?? (summary.importedParticipantId === undefined ? undefined : `${paths.THE_END}?id=${summary.importedParticipantId}`),
    details: importedDetails(summary, snapshots, screenshots),
  };
}

/** All finished games: played here and imported (with final state or only as a screenshot). */
export async function collectStatsGames(
  gameLoader: IGameLoader,
  importedGames: ImportedGamesStore = ImportedGamesStore.getInstance(),
  snapshots: ImportedSnapshotsStore = ImportedSnapshotsStore.getInstance(),
  screenshots: ScreenshotDetailsStore = ScreenshotDetailsStore.getInstance(),
): Promise<Array<StatsGame>> {
  const games: Array<StatsGame> = [];
  for (const {gameId} of await gameLoader.getIds()) {
    if (aiOnlyGames.has(gameId)) {
      continue;
    }
    const cached = finishedLocalGames.get(gameId);
    if (cached !== undefined) {
      games.push(cached);
      continue;
    }
    const game = await gameLoader.getGame(gameId);
    // Broken or running games do not count – running ones are checked again on the next request
    if (game === undefined || game.phase !== Phase.END) {
      continue;
    }
    // Games of AI players only (test runs) say nothing about the group: only games with at
    // least one human count.
    if (game.players.every((player) => player.aiLevel !== undefined)) {
      aiOnlyGames.add(gameId);
      continue;
    }
    const statsGame = localStatsGame(game);
    finishedLocalGames.set(gameId, statsGame);
    games.push(statsGame);
  }
  // Imports are small JSON files; deleted or new imports should take effect immediately, hence no cache
  for (const summary of importedGames.list().filter((candidate) => candidate.isFinished)) {
    games.push(importedStatsGame(summary, snapshots, screenshots));
  }
  return games.sort((first, second) => first.summary.createdTimeMs - second.summary.createdTimeMs);
}

/** For tests: deleted games drop out anyway because only the current game list is read. */
export function forgetStatsGamesForTesting(): void {
  finishedLocalGames.clear();
  aiOnlyGames.clear();
}
