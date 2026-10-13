/** Settings of a LoginThrottle. */
export type LoginThrottleOptions = {
  /** Failures that cost nothing yet (0 = every failure locks) */
  freeFailures: number,
  /** Lock after the first counted failure; doubles with every further one */
  baseDelayMs: number,
  /** Upper bound of the lock, however many failures there were */
  maxDelayMs: number,
  /** A key without a failure for this long starts from zero again */
  forgetAfterMs: number,
};

type FailureRecord = {
  failures: number,
  lockedUntil: number,
  lastFailure: number,
};

// Beyond this many keys, outdated ones are pruned, so a flood of addresses cannot grow memory without bound
const PRUNE_THRESHOLD = 1000;

/**
 * Exponential backoff for failed logins, one counter per key (e.g. the client address).
 *
 * While a key is locked, a login must be refused without checking the passphrase:
 * otherwise parallel requests would still test guesses during the lock.
 */
export class LoginThrottle {
  private readonly records = new Map<string, FailureRecord>();

  constructor(private readonly options: LoginThrottleOptions) {}

  /** Milliseconds until the key may try again; 0 when it is not locked. */
  public remainingLockMs(key: string, now: number): number {
    const record = this.current(key, now);
    return record === undefined ? 0 : Math.max(0, record.lockedUntil - now);
  }

  /** Counts a failed login and returns the lock it causes in milliseconds. */
  public recordFailure(key: string, now: number): number {
    this.pruneIfLarge(now);
    const record = this.current(key, now) ?? {failures: 0, lockedUntil: 0, lastFailure: now};
    record.failures++;
    record.lastFailure = now;
    const counted = record.failures - this.options.freeFailures;
    const lockMs = counted <= 0 ? 0 : Math.min(this.options.maxDelayMs, this.options.baseDelayMs * 2 ** (counted - 1));
    record.lockedUntil = now + lockMs;
    this.records.set(key, record);
    return lockMs;
  }

  /** Forgets the failures of the key after a successful login. */
  public recordSuccess(key: string): void {
    this.records.delete(key);
  }

  private current(key: string, now: number): FailureRecord | undefined {
    const record = this.records.get(key);
    if (record !== undefined && this.isOutdated(record, now)) {
      this.records.delete(key);
      return undefined;
    }
    return record;
  }

  private isOutdated(record: FailureRecord, now: number): boolean {
    return now >= record.lockedUntil && now - record.lastFailure >= this.options.forgetAfterMs;
  }

  private pruneIfLarge(now: number): void {
    if (this.records.size < PRUNE_THRESHOLD) {
      return;
    }
    for (const [key, record] of this.records) {
      if (this.isOutdated(record, now)) {
        this.records.delete(key);
      }
    }
  }
}
