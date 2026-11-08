import {StatsGame} from '@/common/stats/StatsGame';
import {Color} from '@/common/Color';

/** A statistics game with only what the player page reads: names, colours, winner, time. */
export function statsGame(createdTimeMs: number, players: Array<{name: string, color?: Color, isWinner?: boolean}>): StatsGame {
  return {
    summary: {
      id: `g${createdTimeMs}`, source: 'local', createdTimeMs, isFinished: true, generation: 10, spectatorUrl: undefined,
      externalUrl: undefined, importedParticipantId: undefined, screenshotUrl: undefined,
      players: players.map((player) => ({name: player.name, color: player.color ?? 'red', url: undefined, victoryPoints: 0, megaCredits: 0, isWinner: player.isWinner ?? false, corporation: undefined})),
    },
    resultUrl: undefined,
    details: undefined,
  };
}
