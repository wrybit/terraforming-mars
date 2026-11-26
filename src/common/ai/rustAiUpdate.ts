// Self-update of the Rust AI from the GitHub releases (server: ai/rust/RustAiUpdater.ts, admin page: RustAiUpdate.vue).

export type RustAiUpdateState =
  /** Nothing checked yet since the server started */
  | 'idle'
  | 'checking'
  | 'installing'
  /** The installed version is the newest release (or newer, e.g. a server that gets its bot deployed directly) */
  | 'up-to-date'
  /** A newer release is out; installed when automatic updates are on or the admin presses the button */
  | 'available'
  | 'updated'
  | 'failed'
  /** No Rust AI in the bot folder: updates only replace an installed one, they never install it */
  | 'not-installed'
  /** The bot folder cannot be written (e.g. Docker mount with :ro) */
  | 'read-only'
  /** The newest release has no package for this system and CPU */
  | 'no-package';

export type RustAiUpdateStatus = {
  state: RustAiUpdateState,
  /** Setting RUST_AI_AUTO_UPDATE (on unless 'false') */
  autoUpdate: boolean,
  /** aiVersion of the installed bot (rust-ai-support.json) */
  installed?: string,
  /** Version of the newest release */
  available?: string,
  /** ISO time of the last check */
  checkedAt?: string,
  /** English message of the last failure */
  error?: string,
};

/** Release tags are "rust-ai-<version>", e.g. rust-ai-1.10 */
export const RUST_AI_RELEASE_PREFIX = 'rust-ai-';

/** Compares short AI versions part by part as numbers: 1.10 is newer than 1.9. Negative when a is older. */
export function compareAiVersions(a: string, b: string): number {
  const left = a.split('.').map((part) => parseInt(part, 10) || 0);
  const right = b.split('.').map((part) => parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }
  return 0;
}
