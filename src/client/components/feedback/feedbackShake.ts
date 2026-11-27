// Shaking the phone opens the feedback overlay (phones and tablets have neither key F nor an easy menu).
// A shake = several strong jolts in quick succession; walking or a bumpy bus ride stays below that.

/** Acceleration beyond gravity, in m/s², that counts as a jolt */
export const SHAKE_THRESHOLD = 15;
/** Jolts needed within SHAKE_WINDOW_MS */
export const SHAKE_JOLTS = 3;
export const SHAKE_WINDOW_MS = 1000;
/** No second shake right after the first one */
export const SHAKE_PAUSE_MS = 2000;
const GRAVITY = 9.81;

/** Counts jolts; true when they add up to a shake. Separate from the sensor, so tests can feed it. */
export class ShakeDetector {
  private jolts: Array<number> = [];
  private lastShake = -Infinity;

  public sample(x: number, y: number, z: number, time: number): boolean {
    // With gravity included the phone at rest measures about 9.81, so only the excess counts
    const force = Math.abs(Math.hypot(x, y, z) - GRAVITY);
    if (force < SHAKE_THRESHOLD || time - this.lastShake < SHAKE_PAUSE_MS) {
      return false;
    }
    this.jolts = [...this.jolts.filter((jolt) => time - jolt < SHAKE_WINDOW_MS), time];
    if (this.jolts.length < SHAKE_JOLTS) {
      return false;
    }
    this.jolts = [];
    this.lastShake = time;
    return true;
  }
}

type MotionPermission = {requestPermission?: () => Promise<'granted' | 'denied'>};

/**
 * iOS only reports motion after asking, and only from a tap: the welcome dialog's button calls this.
 * Elsewhere motion needs no permission and this does nothing.
 */
export async function requestMotionPermission(): Promise<void> {
  const motion = (window as unknown as {DeviceMotionEvent?: MotionPermission}).DeviceMotionEvent;
  if (typeof motion?.requestPermission === 'function') {
    try {
      await motion.requestPermission();
    } catch {
      // Refused or no tap: the menu still opens the feedback
    }
  }
}

/** Listens for shakes on devices with a motion sensor; returns the function that stops listening. */
export function listenForShake(onShake: () => void): () => void {
  if (!('DeviceMotionEvent' in window)) {
    return () => undefined;
  }
  const detector = new ShakeDetector();
  const listener = (event: DeviceMotionEvent) => {
    const {x, y, z} = event.accelerationIncludingGravity ?? {};
    // Some devices fire the event without values (no sensor)
    if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
      return;
    }
    if (detector.sample(x, y, z, event.timeStamp)) {
      onShake();
    }
  };
  window.addEventListener('devicemotion', listener);
  return () => window.removeEventListener('devicemotion', listener);
}
