import {IGame} from '../../IGame';
import {GameActivity} from './playerActivity';

/** Human players and log times of a game, the input of the activity count. */
export function gameActivity(game: IGame): GameActivity {
  return {
    humanPlayers: game.players.filter((player) => player.aiLevel === undefined).map((player) => player.name),
    eventTimesMs: game.gameLog.map((entry) => entry.timestamp),
  };
}
