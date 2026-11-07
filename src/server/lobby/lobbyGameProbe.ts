import {Phase} from '../../common/Phase';
import {IGameLoader} from '../database/IGameLoader';
import {isActiveParticipant} from '../server/activeParticipants';
import {GameProbe, GameProgressSource} from './Lobby';
import {terraformingProgress} from '../ai/gameProgress';

/** Phases of the initial choice (corporation, preludes, starting cards): until then nothing happened yet */
const INITIAL_CHOICE_PHASES: ReadonlyArray<Phase> = [Phase.INITIALDRAFTING, Phase.RESEARCH];

/** Real game data for Lobby.closeAbandoned: presence from the status polls, phase from the game */
export function lobbyGameProbe(gameLoader: IGameLoader): GameProbe {
  return {
    isPresent: (id) => isActiveParticipant(id),
    hasBegun: async (gameId) => {
      const game = await gameLoader.getGame(gameId);
      if (game === undefined) {
        return undefined;
      }
      return game.generation > 1 || !INITIAL_CHOICE_PHASES.includes(game.phase);
    },
    close: (gameId) => gameLoader.deleteGame(gameId, 'closed-unstarted'),
  };
}

/** Generation and terraforming of a running game for the lobby list */
export function lobbyGameProgress(gameLoader: IGameLoader): GameProgressSource {
  return async (gameId) => {
    const game = await gameLoader.getGame(gameId);
    return game === undefined ? undefined : {generation: game.generation, terraforming: terraformingProgress(game)};
  };
}
