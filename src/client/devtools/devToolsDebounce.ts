// DevTools: every control sends by itself once it has been left alone for a moment (Jens, 20 Oct 2026) – dragging a
// slider sends one change, not one per step. One timer per control, so a change elsewhere never holds another back.
export const DEVTOOLS_DEBOUNCE_MS = 1000;

type Waiting = {timer: ReturnType<typeof setTimeout>, run: () => void};

export class KeyedDebounce {
  private readonly waiting = new Map<string, Waiting>();

  constructor(private readonly waitMs: number = DEVTOOLS_DEBOUNCE_MS) {}

  /** Runs `run` once nothing has been scheduled under `key` for the wait; a newer call replaces the older one */
  public schedule(key: string, run: () => void): void {
    this.cancel(key);
    const timer = setTimeout(() => {
      this.waiting.delete(key);
      run();
    }, this.waitMs);
    this.waiting.set(key, {timer, run});
  }

  /** Still waiting to send: the control keeps its own value instead of taking the one of a reloaded game */
  public isPending(key: string): boolean {
    return this.waiting.has(key);
  }

  public cancel(key: string): void {
    const entry = this.waiting.get(key);
    if (entry !== undefined) {
      clearTimeout(entry.timer);
      this.waiting.delete(key);
    }
  }

  /** Sends everything still waiting at once: closing the panel loses no change */
  public flushAll(): void {
    const entries = [...this.waiting.values()];
    this.waiting.clear();
    for (const entry of entries) {
      clearTimeout(entry.timer);
      entry.run();
    }
  }
}
