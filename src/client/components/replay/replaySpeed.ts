// Replay speed levels: time per step in ms, slowest first. The replay starts at 1.5 s.
export const REPLAY_STEP_MS: ReadonlyArray<number> = [3000, 1500, 750, 325, 160];
export const REPLAY_DEFAULT_SPEED = 1;

// Seconds of a step, in the browser's number format ("0,75" in German)
export function replaySeconds(ms: number): string {
  return (ms / 1000).toLocaleString(undefined, {maximumFractionDigits: 2});
}

// Time the remaining steps take, as m:ss
export function replayRemaining(steps: number, ms: number): string {
  const seconds = Math.round(Math.max(0, steps) * ms / 1000);
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}
