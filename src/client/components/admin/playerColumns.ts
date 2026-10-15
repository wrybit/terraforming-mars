import {AdminGameSummary, AdminPlayerSummary} from '@/common/admin/AdminGameSummary';
import {aiMarkerOf, currentAiName, splitAiMarker} from '@/common/ai/AiLevel';

// Columns of the admin overview: always eleven, however many names there are – human players by seat
// (player 1 to 6), AI players by seat among the AI players (AI 1 to 5). AI chips keep their strength marker.

export const MAX_HUMAN_COLUMNS = 6;
export const MAX_AI_COLUMNS = 5;

export type PlayerColumn = {kind: 'human' | 'ai', seat: number};

function isAi(player: AdminPlayerSummary): boolean {
  return aiMarkerOf(player.name) !== undefined;
}

/** Always the same eleven columns: Player 1 … Player 6, AI 1 … AI 5 – the table never changes its shape. */
export const PLAYER_COLUMNS: ReadonlyArray<PlayerColumn> = [
  ...Array.from({length: MAX_HUMAN_COLUMNS}, (_, seat): PlayerColumn => ({kind: 'human', seat})),
  ...Array.from({length: MAX_AI_COLUMNS}, (_, seat): PlayerColumn => ({kind: 'ai', seat})),
];

/**
 * Players of a game in one column: the n-th human or the n-th AI player in seat order.
 * More players than columns of their kind: the rest join the last column of that kind.
 */
export function playersInColumn(summary: AdminGameSummary, column: PlayerColumn): Array<AdminPlayerSummary> {
  const seated = summary.players.filter((player) => isAi(player) === (column.kind === 'ai'));
  const lastSeat = (column.kind === 'ai' ? MAX_AI_COLUMNS : MAX_HUMAN_COLUMNS) - 1;
  return column.seat === lastSeat ? seated.slice(column.seat) : seated.slice(column.seat, column.seat + 1);
}

/** Name on the chip: AI players keep their strength marker ("Teddy [AI+]"), old "(AI)" becomes "[AI]". */
export function chipName(player: AdminPlayerSummary): string {
  return currentAiName(player.name);
}

/** Name and marker apart: in the narrow chip only the name gets shortened, the strength stays readable. */
export function chipNameParts(player: AdminPlayerSummary): {name: string, marker: string | undefined} {
  return splitAiMarker(chipName(player));
}
