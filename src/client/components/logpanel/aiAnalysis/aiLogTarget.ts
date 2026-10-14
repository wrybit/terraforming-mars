import {Color} from '@/common/Color';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {AiDecisionSummary} from '@/common/ai/AiDecisionSummary';
import {splitAiMarker} from '@/common/ai/AiLevel';
import {LogRow} from '@/client/components/logpanel/logActions';

// Which log rows belong to an AI player in an analysis game, and what a rating of them refers to.

export type AiLogTarget = {
  /** Line the rating is stored under (lead line of the row). */
  messageId: string,
  /** AI decision behind the row, if known. */
  decisionId?: string,
  /** AI player of the row. */
  color: Color,
  /** All lines of the row (text of the row in the dialog). */
  messages: Array<LogMessage>,
};

/** Colours of the AI players: their names carry the [AI] marker (common/ai/AiLevel.ts). */
export function aiColorsOf(players: ReadonlyArray<{color: Color, name: string}>): ReadonlySet<Color> {
  return new Set(players.filter((player) => splitAiMarker(player.name).marker !== undefined).map((player) => player.color));
}

function firstPlayer(message: LogMessage): Color | undefined {
  return message.data.find((datum) => datum.type === LogMessageDataType.PLAYER)?.value as Color | undefined;
}

/** The AI target of a row, or undefined for rows of humans, of nobody, and in other games (no line ids). */
export function aiTargetOfRow(row: LogRow, messages: ReadonlyArray<LogMessage>, aiColors: ReadonlySet<Color>): AiLogTarget | undefined {
  let lead: LogMessage;
  let color: Color | undefined;
  if (row.type === 'message') {
    lead = row.message;
    color = row.message.aiInsight ?? firstPlayer(row.message);
  } else if (row.type === 'action') {
    lead = row.action.lead;
    color = row.action.player;
  } else {
    return undefined;
  }
  if (lead.id === undefined || color === undefined || !aiColors.has(color)) {
    return undefined;
  }
  const lines = row.indexes.map((index) => messages[index]).filter((message) => message !== undefined);
  const decisionId = [lead, ...lines].find((message) => message.aiDecisionId !== undefined)?.aiDecisionId;
  return {messageId: lead.id, decisionId, color, messages: lines.length > 0 ? lines : [lead]};
}

/** Decision summaries by id: only the first line of a decision carries the options. */
export function decisionSummaries(messages: Iterable<LogMessage>): Map<string, AiDecisionSummary> {
  const summaries = new Map<string, AiDecisionSummary>();
  for (const message of messages) {
    if (message.aiDecision !== undefined) {
      summaries.set(message.aiDecision.id, message.aiDecision);
    }
  }
  return summaries;
}
