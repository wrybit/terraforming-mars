import {LobbySetupModel} from '../../common/lobby/LobbyModel';
import {setupOptionsFromGame} from '../../common/game/GameSetupOptions';
import {GameOptions} from '../game/GameOptions';
import {Server} from '../models/ServerModel';

/** Setup chips of an AI training game, from the same options the batch game was created with */
export function aiTrainingSetup(gameOptions: GameOptions): LobbySetupModel {
  return {
    theme: gameOptions.theme,
    expansions: gameOptions.expansions,
    boards: [gameOptions.boardName],
    randomBoard: false,
    options: setupOptionsFromGame(Server.getGameOptionsAsModel(gameOptions)),
  };
}
