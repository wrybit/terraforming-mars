import {LogMessage} from '../../common/logs/LogMessage';
import {LogMessageType} from '../../common/logs/LogMessageType';
import {ParticipantId} from '../../common/Types';
import {IGame} from '../IGame';
import {Phase} from '../../common/Phase';
import {Log} from '../../common/logs/Log';
import {LogMessageData} from '../../common/logs/LogMessageData';
import {LogMessageDataType} from '../../common/logs/LogMessageDataType';
import {aiPlayerOfLine, isSharedAiLine, spoilsOpenChoice} from '../aiFeedback/aiLogLines';
import {AiFeedbackStore} from '../aiFeedback/AiFeedbackStore';
import {AI_FEEDBACK_EMOJI} from '../../common/ai/AiFeedback';

export class GameLogs {
  private getLogsForGeneration(messages: Array<LogMessage>, generation: number): Array<LogMessage> {
    let foundStart = generation === 1;
    const newMessages = [];
    for (const message of messages) {
      if (message.type === LogMessageType.NEW_GENERATION) {
        const value = Number(message.data[0]?.value);
        if (value === generation) {
          foundStart = true;
        } else if (value === generation + 1) {
          break;
        }
      }
      if (foundStart === true) {
        newMessages.push(message);
      }
    }
    return newMessages;
  }

  public getLogsForGameView(playerId: ParticipantId, game: IGame, generation: number | undefined): Array<LogMessage> {
    const messagesForPlayer = (message: LogMessage) => {
      try {
        if (message === undefined || message === null) {
          return false;
        }
        // Analysis game: the AI players' private lines are open to everyone – never those of humans
        return message.playerId === undefined || message.playerId === playerId ||
          (isSharedAiLine(game, message) && !spoilsOpenChoice(game, message, playerId));
      } catch (e) {
        console.error('Error checking message for player', e);
        return false;
      }
    };

    // Default view keeps the payload small. An explicit generation request should
    // always return the full generation, including the current one.
    if (generation === undefined) {
      return game.gameLog.filter(messagesForPlayer).slice(-50).map((message) => this.forReader(game, message, playerId));
    }
    return this.getLogsForGeneration(game.gameLog, generation).filter(messagesForPlayer).map((message) => this.forReader(game, message, playerId));
  }

  /**
   * Another player's (AI) private line goes out as a copy naming the AI by colour: its player id
   * would let the reader play the AI's seat.
   */
  private forReader(game: IGame, message: LogMessage, playerId: ParticipantId): LogMessage {
    if (message.playerId === undefined || message.playerId === playerId) {
      return message;
    }
    const owner = aiPlayerOfLine(game, message);
    const copy: LogMessage = {...message, aiInsight: owner?.color};
    delete copy.playerId;
    return copy;
  }

  public getLogsForGameEnd(game: IGame): Array<string> {
    if (game.phase !== Phase.END) {
      throw new Error('Game is not over');
    }

    // Analysis game: the ratings of a line follow it, so the evaluation reads them in place
    const ratings = game.gameOptions.aiAnalysis === true ? AiFeedbackStore.getInstance().entries(game.id) : [];
    const ratingLines = (message: LogMessage): Array<string> => ratings
      .filter((entry) => entry.messageId === message.id)
      .map((entry) => `    ${AI_FEEDBACK_EMOJI[entry.rating]} ${entry.name}${entry.text === '' ? '' : ': ' + entry.text}` +
        (entry.betterOptionLabel === undefined ? '' : ` → ${entry.betterOptionLabel}`));
    return game.gameLog.flatMap((message) => [Log.applyData(message, (datum: LogMessageData) => {
      if (datum.type === undefined || datum.value === undefined) {
        return '';
      }

      switch (datum.type) {
      case LogMessageDataType.PLAYER:
        for (const player of game.players) {
          if (datum.value === player.color) {
            return player.name;
          }
        }
        // Fall-back, show the player color.
        return datum.value;

      case LogMessageDataType.CARD:
      case LogMessageDataType.GLOBAL_EVENT:
      case LogMessageDataType.TILE_TYPE:
      case LogMessageDataType.COLONY:
      default:
        return datum.value.toString();
      }
    }), ...ratingLines(message)]);
  }
}
