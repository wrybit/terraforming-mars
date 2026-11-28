import {safeLocalStorage} from '@/client/utils/SafeLocalStorage';

// Detects phones that struggle with the full look, so they get reduced effects without searching the settings.
// Chromium (Android) tells the memory size; Safari tells nothing useful (cores clamped to 4 or 8), so there the
// frame rate while scrolling decides. A choice in the settings always wins (PreferencesManager.isChosen).

// Remembered once measured, so the next visit starts lean at once
export const MEASURED_SLOW_KEY = 'reduced_effects_measured_slow';

// Chromium reports memory rounded to powers of two; phones with 4 GB or less are the ones that stutter
const MAX_SLOW_MEMORY_GB = 4;
// Only trusted together with deviceMemory: Safari clamps hardwareConcurrency to 4 on every iPhone
const MAX_SLOW_CORES = 4;

// Frame measurement while the person scrolls
const SETTLE_AFTER_LOAD_MS = 5000; // the first render is slow everywhere
const SAMPLE_MS = 1000;
const SLOW_FRAME_MS = 34; // below 30 frames per second
const SLOW_FRAME_SHARE = 0.35;
const SLOW_SAMPLES_NEEDED = 2;
const MAX_SAMPLES = 6;

// The two values the browser reveals about its hardware (deviceMemory only in Chromium)
export type HardwareHints = {deviceMemory?: number, hardwareConcurrency: number};

export function isLowEndHardware(hints: HardwareHints): boolean {
  const memory = hints.deviceMemory;
  if (memory === undefined) {
    return false;
  }
  return memory <= MAX_SLOW_MEMORY_GB || hints.hardwareConcurrency <= MAX_SLOW_CORES;
}

/** Known before anything is drawn: weak hardware or an earlier measurement on this device. */
export function isKnownSlowDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return safeLocalStorage.getItem(MEASURED_SLOW_KEY) === '1' || isLowEndHardware(navigator as Navigator & HardwareHints);
}

/** Share of frames that took longer than a smooth frame should. */
export function slowFrameShare(frameDurations: ReadonlyArray<number>): number {
  if (frameDurations.length === 0) {
    return 0;
  }
  return frameDurations.filter((duration) => duration > SLOW_FRAME_MS).length / frameDurations.length;
}

/**
 * Measures the frame rate during the first scrolls and calls `onSlow` once if the device keeps dropping frames.
 * `shouldMeasure` is asked before every sample (mobile view, no own choice, effects still on).
 */
export function watchForSlowFrames(shouldMeasure: () => boolean, onSlow: () => void): void {
  if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
    return;
  }
  const startedAt = performance.now();
  let sampling = false;
  let samples = 0;
  let slowSamples = 0;

  const stop = () => window.removeEventListener('scroll', onScroll, {capture: true});

  const sample = () => {
    sampling = true;
    const durations: Array<number> = [];
    let last = performance.now();
    const sampleEnd = last + SAMPLE_MS;
    const frame = (now: number) => {
      durations.push(now - last);
      last = now;
      if (now < sampleEnd) {
        window.requestAnimationFrame(frame);
        return;
      }
      sampling = false;
      samples++;
      if (slowFrameShare(durations) > SLOW_FRAME_SHARE) {
        slowSamples++;
      }
      if (slowSamples >= SLOW_SAMPLES_NEEDED) {
        stop();
        safeLocalStorage.setItem(MEASURED_SLOW_KEY, '1');
        onSlow();
      } else if (samples >= MAX_SAMPLES) {
        stop();
      }
    };
    window.requestAnimationFrame(frame);
  };

  function onScroll(): void {
    if (sampling || performance.now() - startedAt < SETTLE_AFTER_LOAD_MS) {
      return;
    }
    if (!shouldMeasure()) {
      stop();
      return;
    }
    sample();
  }

  window.addEventListener('scroll', onScroll, {capture: true, passive: true});
}
