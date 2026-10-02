import {IGame} from '../IGame';
import {Phase} from '../../common/Phase';
import {AdminGameSummary} from '../../common/admin/AdminGameSummary';
import {toAdminPlayerSummaries} from '../../common/admin/adminPlayerSummaries';
import {paths} from '../../common/app/paths';

/** Fasst ein auf diesem Server gespieltes Spiel für die Admin-Übersicht zusammen. */
export function localGameSummary(game: IGame): AdminGameSummary {
  const isFinished = game.phase === Phase.END;
  const scores = game.playersInGenerationOrder.map((player) => ({
    name: player.name,
    color: player.color,
    url: `${paths.PLAYER}?id=${player.id}`,
    victoryPoints: player.getVictoryPoints().total,
    megaCredits: player.megaCredits,
    corporation: player.playedCards.corporations().map((card) => card.name).join(' / ') || undefined,
  }));
  return {
    id: game.id,
    source: 'local',
    createdTimeMs: game.createdTime.getTime(),
    isFinished,
    generation: game.getGeneration(),
    spectatorUrl: `${paths.SPECTATOR}?id=${game.spectatorId}`,
    externalUrl: undefined,
    importedParticipantId: undefined,
    screenshotUrl: undefined,
    players: toAdminPlayerSummaries(scores, isFinished, game.isSoloModeWin()),
  };
}
