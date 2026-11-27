/**
 * Copy of a JSON value in which every string is passed through `replace` (object keys stay as they are).
 * Used for the shared training data: ids and names can sit anywhere in a saved game (log, deferred actions, ...),
 * so a walk over every string is the only way to be sure none slips through.
 */
export function rewriteStrings(value: unknown, replace: (text: string) => string): unknown {
  if (typeof value === 'string') {
    return replace(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteStrings(item, replace));
  }
  if (value !== null && typeof value === 'object') {
    const copy: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      copy[key] = rewriteStrings(item, replace);
    }
    return copy;
  }
  return value;
}
