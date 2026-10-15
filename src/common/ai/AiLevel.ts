// Strength of a computer-controlled player. Shared by the create-game form and the server.
export const AI_LEVELS = ['easy', 'normal', 'hard'] as const;
export type AiLevel = typeof AI_LEVELS[number];

/** Strength a seat gets as soon as it becomes an AI player in the create form (Jens: always hard). */
export const DEFAULT_AI_LEVEL: AiLevel = 'hard';

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
  return `${name.replace(MARKER_PATTERN, '')} ${aiPlayerMarker(level)}`;
}

/** Marker alone, e.g. "[AI+]" – the create-game form shows it behind the name field. */
export function aiPlayerMarker(level: AiLevel): string {
  return `[AI${LEVEL_MARKS[level]}]`;
}

const CURRENT_MARKER_PATTERN = /^(.*?)\s*(\[AI[-+]?\])$/;

// Older games wrote "(AI)" or "(KI)"; those count as the normal strength
const LEGACY_MARKER_PATTERN = /\s*\((AI|KI)\)$/;

/** Display name with the current marker: an old "(AI)" or "(KI)" becomes "[AI]". */
export function currentAiName(displayName: string): string {
  return displayName.replace(LEGACY_MARKER_PATTERN, ' [AI]');
}

/** Strength marker of an AI player ("[AI+]"), undefined for human players. Old markers count as "[AI]". */
export function aiMarkerOf(displayName: string): string | undefined {
  return splitAiMarker(currentAiName(displayName)).marker;
}

/**
 * Splits a display name into the player's own name and the AI marker, so a narrow name cell can
 * shorten the name itself while "[AI]" stays readable.
 */
export function splitAiMarker(displayName: string): {name: string, marker: string | undefined} {
  const match = CURRENT_MARKER_PATTERN.exec(displayName);
  return match === null ? {name: displayName, marker: undefined} : {name: match[1], marker: match[2]};
}
