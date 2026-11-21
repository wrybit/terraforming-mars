import {SerializedGame} from '../SerializedGame';
import {ReplaySourceModel, ReplaySourceMessage} from '../../common/models/ReplaySourceModel';
import {Color} from '../../common/Color';
import {PlayerId} from '../../common/Types';

/**
 * Raw material for a replay (api/replay): everything the client needs to reconstruct the game step by step from
 * its first and its last save. Player ids are replaced by colours.
 */
export function replaySource(start: SerializedGame, end: SerializedGame): ReplaySourceModel {
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
      const atStart = start.players.find((candidate) => candidate.id === player.id);
      return {
        color: player.color,
        name: player.name,
        startTerraformRating: atStart?.terraformRating ?? player.terraformRating,
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
    startTemperature: start.temperature,
    startOxygenLevel: start.oxygenLevel,
    endTiles: end.board.spaces.flatMap((space) => space.tile === undefined ? [] : [{
      space: space.id,
      tileType: space.tile.tileType,
      ...(space.tile.card !== undefined ? {card: space.tile.card} : {}),
    }]),
    log,
  };
}
