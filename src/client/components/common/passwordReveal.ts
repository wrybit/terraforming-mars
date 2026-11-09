const MASK = '•';
// Whole crossfade, however long the password: quick, but still visible as a movement
export const REVEAL_DURATION_MS = 300;

/** The first |count| characters readable, the rest masked */
export function partlyRevealed(text: string, count: number): string {
  return Array.from(text, (character, index) => index < count ? character : MASK).join('');
}
