import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {LogMessage} from '../../common/logs/LogMessage';
import {LogMessageDataType} from '../../common/logs/LogMessageDataType';

// Which log lines belong to an AI player – those may be shown to everyone and rated in an analysis game.

/** The AI player a line belongs to: its private line, a line of its move, or a line naming it first. */
export function aiPlayerOfLine(game: IGame, message: LogMessage): IPlayer | undefined {
  if (message.playerId !== undefined) {
    const owner = game.players.find((player) => player.id === message.playerId);
    return owner?.aiLevel !== undefined ? owner : undefined;
  }
  const first = message.data.find((datum) => datum.type === LogMessageDataType.PLAYER);
  const named = game.players.find((player) => player.color === first?.value);
  return named?.aiLevel !== undefined ? named : undefined;
}

/** True if the line is private to an AI player and the game lets everyone read it. */
export function isSharedAiLine(game: IGame, message: LogMessage): boolean {
  if (game.gameOptions.aiAnalysis !== true || message.playerId === undefined) {
    return false;
  }
  return aiPlayerOfLine(game, message) !== undefined;
}
