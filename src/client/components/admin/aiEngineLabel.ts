// Program names stay as they are in every language, and "AI" is never translated (fork rule)
const ENGINE_NAMES = {rust: 'Rust', typescript: 'TypeScript'} as const;

/** AI program that played, with the Rust AI's version, e.g. "Rust 1.4"; undefined for games without AI. */
export function aiEngineName(engine: unknown, version?: unknown): string | undefined {
  if (engine !== 'rust' && engine !== 'typescript') {
    return undefined;
  }
  return ENGINE_NAMES[engine] + (engine === 'rust' && typeof version === 'string' ? ' ' + version : '');
}

/** Small admin note of the AI program that played, e.g. "AI: Rust 1.4"; undefined for games without AI. */
export function aiEngineLabel(engine: unknown, version?: unknown): string | undefined {
  const name = aiEngineName(engine, version);
  return name === undefined ? undefined : 'AI: ' + name;
}
