// Volume ramps of the music players (gameMusic.ts): each player has a fade share (0..1) on top of the listener's
// volume, so the crossfade between two tracks and the volume slider never fight each other.
// setInterval instead of requestAnimationFrame: the music also changes tracks in a background tab, where animation
// frames stop.

const STEP_MS = 50;

const shares = new WeakMap<HTMLAudioElement, number>();
const ramps = new WeakMap<HTMLAudioElement, number>();

/** Sets the player's volume from the listener's volume and its fade share */
export function applyVolume(player: HTMLAudioElement, volume: number): void {
  player.volume = Math.min(1, Math.max(0, volume * (shares.get(player) ?? 1)));
}

/** Fades the player's share from its current value to `to` within `durationMs`; `done` runs at the end */
export function rampVolume(player: HTMLAudioElement, to: number, durationMs: number, volume: () => number, done?: () => void): void {
  window.clearInterval(ramps.get(player));
  const from = shares.get(player) ?? 1;
  const start = Date.now();
  const step = () => {
    const share = Math.min(1, (Date.now() - start) / durationMs);
    shares.set(player, from + (to - from) * share);
    applyVolume(player, volume());
    if (share >= 1) {
      window.clearInterval(ramps.get(player));
      ramps.delete(player);
      done?.();
    }
  };
  ramps.set(player, window.setInterval(step, STEP_MS));
  step();
}

/** Sets the share at once (no ramp), e.g. full volume for a track started without crossfade */
export function setShare(player: HTMLAudioElement, share: number, volume: number): void {
  window.clearInterval(ramps.get(player));
  ramps.delete(player);
  shares.set(player, share);
  applyVolume(player, volume);
}
