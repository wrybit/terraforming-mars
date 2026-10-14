import {Context} from '../routes/IHandler';

// Beyond this many addresses, the ones whose window has passed are removed
const PRUNE_THRESHOLD = 1000;

export type QuotaConfig = {
  limit: number;
  perMs: number;
}

export class QuotaHandler {
  private times = new Map<string, Array<number | undefined>>();

  private limit: number;
  private perMs: number;

  constructor(config: QuotaConfig) {
    this.limit = config.limit;
    this.perMs = config.perMs;
    console.log(`Initialzing quota handler with {limit: ${this.limit}, perMs: ${this.perMs}}`);
  }

  measure(ctx: Context): boolean {
    const ip = ctx.ip;
    const now = ctx.clock.now();
    this.pruneIfLarge(now);

    const times = this.times.get(ip) || [];
    times.unshift(now);
    times.length = this.limit + 1; // Trims the end, keeps the array the right size. (There are more efficient ways to do this, especially in C.)
    this.times.set(ip, times);

    const earliest = now - this.perMs;
    const oldestInCache = times[times.length - 1];
    if (oldestInCache !== undefined && oldestInCache > earliest) {
      return false;
    }

    return true;
  }

  // Every address that ever created a game stays in the map otherwise: memory would grow without bound
  private pruneIfLarge(now: number): void {
    if (this.times.size < PRUNE_THRESHOLD) {
      return;
    }
    const earliest = now - this.perMs;
    for (const [ip, times] of this.times) {
      if (times.every((time) => time === undefined || time <= earliest)) {
        this.times.delete(ip);
      }
    }
  }
}
