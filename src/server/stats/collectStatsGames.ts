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
import {CardName} from '../../common/cards/CardName';
import {StatsGameDetails} from '../../common/stats/StatsGame';

// Beendete Partien ändern sich nicht mehr: einmal ausgewertet, bleiben sie im Speicher.
// Spart bei jedem Aufruf der Statistik das Erzeugen der kompletten Endstände.
const finishedLocalGames = new Map<string, StatsGame>();

/** Konzerne unter ihrem englischen Kartennamen; Unbekanntes (z. B. "Steam-Version") fällt weg. */
function canonicalCorporations(corporation: string | undefined): string | undefined {
  const names = (corporation ?? '').split(' / ')
    .map(resolveCardName)
    .filter((name) => name !== undefined);
  return names.length === 0 ? undefined : names.join(' / ');
}

/** Die Statistikseite ist öffentlich: Spieler- und Zuschauer-Links haben dort nichts zu suchen. */
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

/** Kartennamen aus abgelesenen Screenshots absichern: Unbekanntes fällt weg, statt die Statistik zu verfälschen. */
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
  return fromScreenshot === undefined ? undefined : knownCards(fromScreenshot.details);
}

function importedStatsGame(summary: AdminGameSummary, snapshots: ImportedSnapshotsStore, screenshots: ScreenshotDetailsStore): StatsGame {
  return {
    summary: publicSummary(summary),
    resultUrl: summary.screenshotUrl ?? (summary.importedParticipantId === undefined ? undefined : `${paths.THE_END}?id=${summary.importedParticipantId}`),
    details: importedDetails(summary, snapshots, screenshots),
  };
}

/** Alle beendeten Partien: hier gespielte und importierte (mit Endstand oder nur als Screenshot). */
export async function collectStatsGames(
  gameLoader: IGameLoader,
  importedGames: ImportedGamesStore = ImportedGamesStore.getInstance(),
  snapshots: ImportedSnapshotsStore = ImportedSnapshotsStore.getInstance(),
  screenshots: ScreenshotDetailsStore = ScreenshotDetailsStore.getInstance(),
): Promise<Array<StatsGame>> {
  const games: Array<StatsGame> = [];
  for (const {gameId} of await gameLoader.getIds()) {
    const cached = finishedLocalGames.get(gameId);
    if (cached !== undefined) {
      games.push(cached);
      continue;
    }
    const game = await gameLoader.getGame(gameId);
    // Defekte oder laufende Partien zählen nicht – laufende werden beim nächsten Aufruf erneut geprüft
    if (game === undefined || game.phase !== Phase.END) {
      continue;
    }
    const statsGame = localStatsGame(game);
    finishedLocalGames.set(gameId, statsGame);
    games.push(statsGame);
  }
  // Importe sind kleine JSON-Dateien; gelöschte oder neue Importe sollen sofort wirken, daher ohne Zwischenspeicher
  for (const summary of importedGames.list().filter((candidate) => candidate.isFinished)) {
    games.push(importedStatsGame(summary, snapshots, screenshots));
  }
  return games.sort((first, second) => first.summary.createdTimeMs - second.summary.createdTimeMs);
}

/** Für Tests: gelöschte Partien fallen ohnehin heraus, weil nur über die aktuelle Spieleliste gelesen wird. */
export function forgetStatsGamesForTesting(): void {
  finishedLocalGames.clear();
}
