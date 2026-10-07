// Strength of a computer-controlled player. Shared by the create-game form and the server.
export const AI_LEVELS = ['easy', 'normal', 'hard'] as const;
export type AiLevel = typeof AI_LEVELS[number];

export function isAiLevel(value: unknown): value is AiLevel {
  return typeof value === 'string' && (AI_LEVELS as ReadonlyArray<string>).includes(value);
}
