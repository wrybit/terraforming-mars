// Animates a number from one value to another frame by frame (drag handles: double click glides back to the
// default instead of jumping). With "reduce motion" or without requestAnimationFrame it jumps to the end at once.

export const TWEEN_DURATION_MS = 250;

// Starts fast, ends gently
const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3);

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// onFrame gets every intermediate value, onDone runs after the last one; returns a function that stops the animation
export function tween(from: number, to: number, onFrame: (value: number) => void, onDone: () => void = () => {}, durationMs = TWEEN_DURATION_MS): () => void {
  if (from === to || prefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
    onFrame(to);
    onDone();
    return () => {};
  }
  let frame: number | undefined;
  let start: number | undefined;
  const step = (time: number) => {
    start ??= time;
    const progress = Math.min(1, (time - start) / durationMs);
    onFrame(from + (to - from) * easeOutCubic(progress));
    if (progress < 1) {
      frame = requestAnimationFrame(step);
    } else {
      frame = undefined;
      onDone();
    }
  };
  frame = requestAnimationFrame(step);
  return () => {
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
      frame = undefined;
    }
  };
}
