import {AdminGameSummary, AdminPlayerSummary} from '@/common/admin/AdminGameSummary';
import {splitAiMarker} from '@/common/ai/AiLevel';

// Columns of the admin overview: at most nine, however many names there are – human players by seat
// (player 1 to 6), AI players by strength (AI-, AI, AI+). The chips name the player themselves.

export const MAX_HUMAN_COLUMNS = 6;
const AI_MARKERS = ['[AI-]', '[AI]', '[AI+]'] as const;

export type PlayerColumn =
  {kind: 'human', seat: number} |
  {kind: 'ai', marker: typeof AI_MARKERS[number]};

// AI marker of a name; older games wrote "(AI)" or "(KI)", those count as the normal strength
function aiMarker(name: string): string | undefined {
  return /\s*\((AI|KI)\)$/.test(name) ? '[AI]' : splitAiMarker(name).marker;
}

function humans(summary: AdminGameSummary): Array<AdminPlayerSummary> {
  return summary.players.filter((player) => aiMarker(player.name) === undefined);
}

/** Always the same nine columns: Player 1 … Player 6, [AI-], [AI], [AI+] – the table never changes its shape. */
export const PLAYER_COLUMNS: ReadonlyArray<PlayerColumn> = [
  ...Array.from({length: MAX_HUMAN_COLUMNS}, (_, seat): PlayerColumn => ({kind: 'human', seat})),
  ...AI_MARKERS.map((marker): PlayerColumn => ({kind: 'ai', marker})),
];

/**
 * Players of a game in one column: the n-th human in seat order, or all AI players of that strength
 * (several of the same strength share the cell). More than six humans: the rest join the last column.
 */
export function playersInColumn(summary: AdminGameSummary, column: PlayerColumn): Array<AdminPlayerSummary> {
  if (column.kind === 'ai') {
    return summary.players.filter((player) => aiMarker(player.name) === column.marker);
  }
  const seated = humans(summary);
  return column.seat === MAX_HUMAN_COLUMNS - 1 ? seated.slice(column.seat) : seated.slice(column.seat, column.seat + 1);
}

/** Name on the chip: without the AI marker, the column already says it. */
export function chipName(player: AdminPlayerSummary): string {
  return splitAiMarker(player.name.replace(/\s*\((AI|KI)\)$/, '')).name;
}
