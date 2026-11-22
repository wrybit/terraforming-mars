// Which program plays an AI player: the TS AI in the server, or the Rust AI (a separate program, installed only
// on some servers). Both run side by side; the create-game form picks one per AI seat.
export const AI_ENGINES = ['ts', 'rust'] as const;
export type AiEngine = typeof AI_ENGINES[number];

export const DEFAULT_AI_ENGINE: AiEngine = 'ts';

export function isAiEngine(value: unknown): value is AiEngine {
  return typeof value === 'string' && (AI_ENGINES as ReadonlyArray<string>).includes(value);
}

/**
 * The TS AI gets a few simplified Dune menus (CHOAM moves directly in the action menu). The new AI sees the menus
 * humans see: it learned from games recorded with them and follows every answer in its own copy of the game.
 */
export function hasTsAiMenus(player: {aiLevel?: unknown, aiEngine?: unknown}): boolean {
  return player.aiLevel !== undefined && player.aiEngine !== 'rust';
}

/** AI program that played a game, for admins: Rust when any seat had the Rust AI, TypeScript for other AI seats. */
export function aiEngineOfGame(players: ReadonlyArray<{aiLevel?: unknown, aiEngine?: unknown}>): 'rust' | 'typescript' | undefined {
  if (players.some((player) => player.aiLevel !== undefined && player.aiEngine === 'rust')) {
    return 'rust';
  }
  return players.some((player) => player.aiLevel !== undefined) ? 'typescript' : undefined;
}
