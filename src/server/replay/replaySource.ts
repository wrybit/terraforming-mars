import {SerializedGame} from '../SerializedGame';
import {ReplaySourceModel, ReplaySourceMessage} from '../../common/models/ReplaySourceModel';
import {Color} from '../../common/Color';
import {PlayerId} from '../../common/Types';
import {Phase} from '../../common/Phase';
import {MIN_OXYGEN_LEVEL, MIN_TEMPERATURE} from '../../common/constants';
import {SerializedPlayer} from '../SerializedPlayer';

// TR every game starts with (Game.ts): 14 alone, otherwise 20, plus the player's handicap
function initialTerraformRating(game: SerializedGame, player: SerializedPlayer): number {
  return (game.players.length === 1 ? 14 : 20) + (player.handicap ?? 0);
}

/**
 * Raw material for a replay (api/replay): everything the client needs to reconstruct the game step by step from
 * its first and its last save. Player ids are replaced by colours.
 */
export function replaySource(start: SerializedGame, end: SerializedGame): ReplaySourceModel {
  // Imported games (self-play archive, games of other servers) are saved only once, already finished: their first
  // save is the end. Then the replay starts from the values every game starts with instead of the final ones.
  const startIsEnd = start.phase === Phase.END;
  const colors = new Map<PlayerId, Color>(end.players.map((player) => [player.id, player.color]));
  const log: Array<ReplaySourceMessage> = end.gameLog.map((message) => {
    const viewer = message.playerId !== undefined ? colors.get(message.playerId) : undefined;
    return {
      message: message.message,
      data: message.data,
      ...(message.type !== undefined ? {type: message.type} : {}),
      ...(viewer !== undefined ? {viewer} : {}),
    };
  });
  return {
    players: end.players.map((player) => {
      const atStart = startIsEnd ? undefined : start.players.find((candidate) => candidate.id === player.id);
      return {
        color: player.color,
        name: player.name,
        startTerraformRating: atStart?.terraformRating ?? initialTerraformRating(end, player),
        dealtProjectCards: atStart?.dealtProjectCards ?? [],
        endResources: {
          megacredits: player.megaCredits,
          steel: player.steel,
          titanium: player.titanium,
          plants: player.plants,
          energy: player.energy,
          heat: player.heat,
        },
        endHand: player.cardsInHand,
      };
    }),
    startTemperature: startIsEnd ? MIN_TEMPERATURE : start.temperature,
    startOxygenLevel: startIsEnd ? MIN_OXYGEN_LEVEL : start.oxygenLevel,
    endTiles: end.board.spaces.flatMap((space) => space.tile === undefined ? [] : [{
      space: space.id,
      tileType: space.tile.tileType,
      ...(space.tile.card !== undefined ? {card: space.tile.card} : {}),
    }]),
    log,
  };
}
