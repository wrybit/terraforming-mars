import {LogMessageType} from './LogMessageType';
import {LogMessageData} from './LogMessageData';
import {Message} from './Message';
import {PlayerId} from '../Types';
import {Color} from '../Color';
import {AiDecisionSummary} from '../ai/AiDecisionSummary';

export class LogMessage implements Message {
  public playerId?: PlayerId;
  public timestamp = Date.now();
  public type?: LogMessageType;
  // Analysis games only (aiAnalysis): stable id of the line, so ratings can refer to it
  public id?: string;
  // Analysis games only: the AI decision that caused this line; the first line of a decision carries its options
  public aiDecisionId?: string;
  public aiDecision?: AiDecisionSummary;
  // Set on the copy sent to other players: a private line of this AI player, shown in an analysis game.
  // Replaces playerId there, so the AI's player id (which would allow playing its seat) never leaves the server.
  public aiInsight?: Color;
  constructor(
    type: LogMessageType,
    public message: string,
    public data: Array<LogMessageData>,
    // When set, this message is private for the specifed player.
    // Always filter messages so they're not sent to the wrong player.
    playerId?: PlayerId) {
    // setting in body to avoid setting property when
    // argument is undefined for less memory usage
    if (playerId !== undefined) {
      this.playerId = playerId;
    }
    // only store property if not default
    // for less memory usage. majority
    // of messages are default
    if (type !== LogMessageType.DEFAULT) {
      this.type = type;
    }
  }
}

