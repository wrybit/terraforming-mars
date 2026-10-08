// Strength of a computer-controlled player. Shared by the create-game form and the server.
export const AI_LEVELS = ['easy', 'normal', 'hard'] as const;
export type AiLevel = typeof AI_LEVELS[number];

export function isAiLevel(value: unknown): value is AiLevel {
  return typeof value === 'string' && (AI_LEVELS as ReadonlyArray<string>).includes(value);
}

const LEVEL_MARKS: Record<AiLevel, string> = {easy: '-', normal: '', hard: '+'};

/** Old and current markers, removed before the current one is added again. */
const MARKER_PATTERN = /\s*(\((AI|KI)\)|\[AI[-+]?\])\s*$/;

/**
 * Display name of an AI player: "<name> [AI<level>]" with "-" for easy, "+" for hard and no
 * mark for normal. Stays the same in game logs, results and statistics.
 */
export function aiPlayerName(name: string, level: AiLevel): string {
  return `${name.replace(MARKER_PATTERN, '')} [AI${LEVEL_MARKS[level]}]`;
}
