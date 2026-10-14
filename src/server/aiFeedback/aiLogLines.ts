import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {LogMessage} from '../../common/logs/LogMessage';
import {LogMessageDataType} from '../../common/logs/LogMessageDataType';
import {Phase} from '../../common/Phase';
import {ParticipantId} from '../../common/Types';

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

// Lines that would spoil the reader's own choice: what the AI kept and bought shows only after the
// reader has made that choice too, its draft picks only once the draft is over
const DRAFT_LINES = new Set(['${0} drafted ${1}', '${0} drafted ${1}, passing ${2} to ${3}']);
const SELECTION_LINES = new Set(['${0} kept ${1}', '${0} bought ${1}', '${0} bought no cards', '${0} discarded ${1}']);
const DRAFT_PHASES: ReadonlyArray<Phase> = [Phase.DRAFTING, Phase.INITIALDRAFTING];

/** True while a shared AI line must stay hidden from this reader (its own choice still open). */
export function spoilsOpenChoice(game: IGame, message: LogMessage, readerId: ParticipantId): boolean {
  const reader = game.players.find((player) => player.id === readerId);
  if (reader === undefined) {
    return false; // spectators choose nothing
  }
  if (DRAFT_LINES.has(message.message)) {
    return DRAFT_PHASES.includes(game.phase);
  }
  if (SELECTION_LINES.has(message.message)) {
    // Purchase (and the start selection, which is a research phase too) still open, or the draft before it
    return DRAFT_PHASES.includes(game.phase) || (game.phase === Phase.RESEARCH && !game.hasResearched(reader));
  }
  return false;
}
