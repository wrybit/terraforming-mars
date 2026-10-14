import {IGame} from '../IGame';
import {Phase} from '../../common/Phase';
import {AdminGameSummary} from '../../common/admin/AdminGameSummary';
import {toAdminPlayerSummaries} from '../../common/admin/adminPlayerSummaries';
import {paths} from '../../common/app/paths';
import {isActiveParticipant} from '../server/activeParticipants';
import {participantLanguage} from '../server/participantLanguages';
import {isIProjectCard} from '../cards/IProjectCard';

/** Summarizes a game played on this server for the admin overview. */
export function localGameSummary(game: IGame): AdminGameSummary {
  const isFinished = game.phase === Phase.END;
  const scores = game.playersInGenerationOrder.map((player) => ({
    name: player.name,
    color: player.color,
    url: `${paths.PLAYER}?id=${player.id}`,
    victoryPoints: player.getVictoryPoints().total,
    megaCredits: player.megaCredits,
    corporation: player.playedCards.corporations().map((card) => card.name).join(' / ') || undefined,
    isOnline: !isFinished && isActiveParticipant(player.id),
    language: participantLanguage(player.id),
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
    resultUrl: isFinished ? `${paths.THE_END}?id=${game.playersInGenerationOrder[0].id}` : undefined,
    playedCardCount: game.players.reduce((sum, player) => sum + player.playedCards.asArray().filter(isIProjectCard).length, 0),
    players: toAdminPlayerSummaries(scores, isFinished, game.isSoloModeWin()),
  };
}
