import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {LogMessage} from '../../common/logs/LogMessage';
import {LogMessageDataType} from '../../common/logs/LogMessageDataType';
import {AiDecisionSummary} from '../../common/ai/AiDecisionSummary';

// Analysis games (gameOptions.aiAnalysis): every log line gets an id, and the lines an AI move
// produces point to the AI decision behind them, so players can rate exactly that decision.
// Kept apart from the AI code: Game.log calls in here, and the AI code imports half the server.

type RunningDecision = {player: IPlayer, summary: AiDecisionSummary, attached: boolean};

const running = new WeakMap<IGame, RunningDecision>();
// A draft pick is logged only when the whole table has picked: the decision waits for that line
const waitingDraftPicks = new WeakMap<IPlayer, AiDecisionSummary>();

/** Runs the processing of an AI answer; the lines it logs for that player point to the decision. */
export function runWithAiDecision(player: IPlayer, summary: AiDecisionSummary | undefined, run: () => void): void {
  if (summary === undefined) {
    run();
    return;
  }
  const decision: RunningDecision = {player, summary, attached: false};
  running.set(player.game, decision);
  try {
    run();
  } finally {
    running.delete(player.game);
    if (!decision.attached && summary.kind === 'draft') {
      waitingDraftPicks.set(player, summary);
    }
  }
}

/** True if the line is about this player: their private line, or a public line naming them first. */
function concerns(message: LogMessage, player: IPlayer): boolean {
  if (message.playerId !== undefined) {
    return message.playerId === player.id;
  }
  const first = message.data.find((datum) => datum.type === LogMessageDataType.PLAYER);
  return first?.value === player.color;
}

function attach(message: LogMessage, summary: AiDecisionSummary, first: boolean): void {
  message.aiDecisionId = summary.id;
  // The options travel with the first line only; later lines of the same move refer to it by id
  if (first) {
    message.aiDecision = summary;
  }
}

/** Called by Game.log before the line is stored. */
export function annotateLogMessage(game: IGame, message: LogMessage): void {
  if (game.gameOptions.aiAnalysis !== true) {
    return;
  }
  // Index plus time: after an undo a new line takes the same index, ratings of the old one must not move to it
  message.id = `${game.gameLog.length}.${message.timestamp.toString(36)}`;
  const decision = running.get(game);
  if (decision !== undefined && concerns(message, decision.player)) {
    attach(message, decision.summary, !decision.attached);
    decision.attached = true;
    return;
  }
  for (const player of game.players) {
    const pick = waitingDraftPicks.get(player);
    if (pick !== undefined && concerns(message, player)) {
      attach(message, pick, true);
      waitingDraftPicks.delete(player);
      return;
    }
  }
}
