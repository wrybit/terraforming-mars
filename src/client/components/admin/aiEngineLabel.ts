// Program names stay as they are in every language, and "AI" is never translated (fork rule)
const ENGINE_NAMES = {rust: 'Rust', typescript: 'TypeScript'} as const;

/** Small admin note of the AI program that played, e.g. "AI: Rust"; undefined for games without AI. */
export function aiEngineLabel(engine: unknown): string | undefined {
  return engine === 'rust' || engine === 'typescript' ? 'AI: ' + ENGINE_NAMES[engine] : undefined;
}
