/* Rotation of the planet buttons: on hover slowly to the right, reversing smoothly at the end of the texture;
   on leave back quickly at first, then easing out. The loop only runs while something is moving. */
import {GlobePlacement} from './globeLayout';
import {PlanetRenderer} from './planetRenderer';
import {PlanetStripe, rotationLimits} from './planetStripes';

// Sprite pixels of surface per second on hover
const ROTATE_SPEED = 1000 / 45;
// the smaller, the more softly the rotation brakes and reverses at the ends
const TURN_SOFTNESS = 1.2;
// 1/s: how fast the glow fades in and out on hover
const GLOW_SPEED = 4;
// Rotating back: duration grows with the distance rotated (short hover = short return)
const returnDuration = (distance: number) => Math.min(3000, 900 + Math.abs(distance) * 4);
const easeOutCubic = (progress: number) => 1 - Math.pow(1 - Math.min(progress, 1), 3);

type PlanetButton = {
  target: HTMLCanvasElement;
  placement: GlobePlacement;
  stripe: PlanetStripe;
  limits: {min: number, max: number};
  offset: number;
  velocity: number;
  direction: 1 | -1;
  glow: number;
  hovered: boolean;
  return?: {start: number, from: number};
};

export class PlanetRotation {
  private readonly buttons: Array<PlanetButton> = [];
  private looping = false;
  private lastTime = 0;
  private frame = 0;

  constructor(private readonly renderer: PlanetRenderer, private readonly reducedMotion: boolean) {}

  public add(target: HTMLCanvasElement, placement: GlobePlacement, stripe: PlanetStripe): number {
    this.buttons.push({target, placement, stripe, limits: rotationLimits(stripe), offset: 0, velocity: 0, direction: 1, glow: 0, hovered: false});
    return this.buttons.length - 1;
  }

  public setHovered(index: number, hovered: boolean): void {
    const button = this.buttons[index];
    if (button === undefined || button.hovered === hovered) {
      return;
    }
    button.hovered = hovered;
    if (hovered) {
      button.return = undefined;
      button.direction = 1;
      button.velocity = 0;
    } else {
      button.return = {start: performance.now(), from: button.offset};
    }
    this.startLoop();
  }

  /** New position of a button in the globe (after a resize). */
  public setPlacement(index: number, placement: GlobePlacement): void {
    const button = this.buttons[index];
    if (button !== undefined) {
      button.placement = placement;
    }
  }

  /** Redraw all, e.g. after a resize. */
  public drawAll(): void {
    this.buttons.forEach((button) => this.draw(button));
  }

  public stop(): void {
    cancelAnimationFrame(this.frame);
    this.looping = false;
  }

  private draw(button: PlanetButton): void {
    this.renderer.draw({target: button.target, placement: button.placement, stripe: button.stripe, offset: button.offset, glow: button.glow});
  }

  private startLoop(): void {
    if (this.looping) {
      return;
    }
    this.looping = true;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame((now) => this.tick(now));
  }

  private tick(now: number): void {
    const elapsed = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    let active = false;
    for (const button of this.buttons) {
      const moved = this.advance(button, now, elapsed);
      if (moved) {
        this.draw(button);
        active = true;
      }
    }
    if (active) {
      this.frame = requestAnimationFrame((time) => this.tick(time));
    } else {
      this.looping = false;
    }
  }

  // One time step for a button; true while it is still changing
  private advance(button: PlanetButton, now: number, elapsed: number): boolean {
    let changed = false;
    const glowTarget = button.hovered ? 1 : 0;
    if (button.glow !== glowTarget) {
      const step = GLOW_SPEED * elapsed;
      button.glow = glowTarget > button.glow ? Math.min(1, button.glow + step) : Math.max(0, button.glow - step);
      changed = true;
    }
    if (button.hovered && !this.reducedMotion) {
      // Reverse at the end of the texture; the speed follows smoothly so the reversal doesn't jerk
      if (button.offset >= button.limits.max) {
        button.direction = -1;
      }
      if (button.offset <= button.limits.min) {
        button.direction = 1;
      }
      button.velocity += (button.direction * ROTATE_SPEED - button.velocity) * Math.min(1, elapsed * TURN_SOFTNESS);
      button.offset += button.velocity * elapsed;
      changed = true;
    } else if (button.return !== undefined) {
      const progress = (now - button.return.start) / returnDuration(button.return.from);
      button.offset = button.return.from * (1 - easeOutCubic(progress));
      if (progress >= 1) {
        button.offset = 0;
        button.return = undefined;
      }
      changed = true;
    }
    return changed;
  }
}
