// Several changes becoming visible at once (e.g. opening a tab) blink one after the other,
// so the eye can follow them. Long queues are capped, the last ones then blink together.

const STAGGER_MS = 120;
const MAX_DELAY_MS = 1200;

let nextSlot = 0;

// One effect per changed value (blink or count); it receives its delay in the queue
export function scheduleEffect(run: (delayMs: number) => void): void {
  const now = performance.now();
  const start = Math.min(Math.max(now, nextSlot), now + MAX_DELAY_MS);
  nextSlot = start + STAGGER_MS;
  run(start - now);
}
