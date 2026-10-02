/* Drehung der Planeten-Buttons: beim Hover langsam nach rechts, am Ende der Textur weich umkehren;
   beim Verlassen erst schnell, dann weich auslaufend zurück. Die Schleife läuft nur, solange sich etwas bewegt. */
import {PlanetRenderer} from './planetRenderer';
import {PlanetStripe, rotationLimits} from './planetStripes';

// Sprite-Pixel Oberfläche pro Sekunde beim Hover
const ROTATE_SPEED = 1000 / 45;
// je kleiner, desto weicher bremst die Drehung an den Enden ab und kehrt um
const TURN_SOFTNESS = 1.2;
// 1/s: wie schnell das Leuchten beim Hover ein- und ausblendet
const GLOW_SPEED = 4;
// Zurückdrehen: Dauer wächst mit der gedrehten Strecke (kurzer Hover = kurzes Zurück)
const returnDuration = (distance: number) => Math.min(3000, 900 + Math.abs(distance) * 4);
const easeOutCubic = (progress: number) => 1 - Math.pow(1 - Math.min(progress, 1), 3);

type PlanetButton = {
  target: HTMLCanvasElement;
  row: number;
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

  public add(target: HTMLCanvasElement, row: number, stripe: PlanetStripe): number {
    this.buttons.push({target, row, stripe, limits: rotationLimits(stripe), offset: 0, velocity: 0, direction: 1, glow: 0, hovered: false});
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

  /** Alle neu zeichnen, z. B. nach Größenänderung. */
  public drawAll(): void {
    this.buttons.forEach((button) => this.draw(button));
  }

  public stop(): void {
    cancelAnimationFrame(this.frame);
    this.looping = false;
  }

  private draw(button: PlanetButton): void {
    this.renderer.draw({target: button.target, row: button.row, stripe: button.stripe, offset: button.offset, glow: button.glow});
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

  // Ein Zeitschritt für einen Button; true, solange er sich noch verändert
  private advance(button: PlanetButton, now: number, elapsed: number): boolean {
    let changed = false;
    const glowTarget = button.hovered ? 1 : 0;
    if (button.glow !== glowTarget) {
      const step = GLOW_SPEED * elapsed;
      button.glow = glowTarget > button.glow ? Math.min(1, button.glow + step) : Math.max(0, button.glow - step);
      changed = true;
    }
    if (button.hovered && !this.reducedMotion) {
      // Am Ende der Textur umkehren; die Geschwindigkeit folgt weich, damit die Umkehr nicht ruckt
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
