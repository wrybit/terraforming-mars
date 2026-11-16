// Which program plays an AI player: the TS AI in the server, or the Rust AI (a separate program, installed only
// on some servers). Both run side by side; the create-game form picks one per AI seat.
export const AI_ENGINES = ['ts', 'rust'] as const;
export type AiEngine = typeof AI_ENGINES[number];

export const DEFAULT_AI_ENGINE: AiEngine = 'ts';

export function isAiEngine(value: unknown): value is AiEngine {
  return typeof value === 'string' && (AI_ENGINES as ReadonlyArray<string>).includes(value);
}
