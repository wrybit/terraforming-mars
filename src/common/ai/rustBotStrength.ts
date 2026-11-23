import {AiLevel} from './AiLevel';

/** Search effort of the Rust bot for one strength; randomness: 0 always the best move, 100 any of its candidates. */
export type RustBotStrength = {
  rollouts: number;
  threads: number;
  horizon: number;
  candidates: number;
  /** Thinking time per decision in milliseconds; the bot stops its search there */
  timeLimit: number;
  randomness: number;
};

export const RUST_BOT_STRENGTH_FIELDS = ['rollouts', 'threads', 'horizon', 'candidates', 'timeLimit', 'randomness'] as const;
export type RustBotStrengthField = typeof RUST_BOT_STRENGTH_FIELDS[number];

// Defaults: the time limit keeps the bot about as quick as the TS AI on slow servers (AK1: 64 rollouts took 9 s for
// one decision); the search stops there with fewer rollouts. A started rollout still ends and the first round over
// all candidates always runs, so a decision takes up to about twice the limit on AK1.
export const DEFAULT_RUST_BOT_STRENGTH: Readonly<Record<AiLevel, RustBotStrength>> = {
  easy: {rollouts: 4, threads: 1, horizon: 0, candidates: 4, timeLimit: 750, randomness: 0},
  normal: {rollouts: 16, threads: 2, horizon: 0, candidates: 6, timeLimit: 1700, randomness: 0},
  hard: {rollouts: 64, threads: 2, horizon: 0, candidates: 8, timeLimit: 2600, randomness: 0},
};

/** Smallest and largest value an admin may set (largest: none when missing). */
export const RUST_BOT_STRENGTH_LIMITS: Readonly<Record<RustBotStrengthField, {minimum: number, maximum?: number}>> = {
  rollouts: {minimum: 1},
  threads: {minimum: 1, maximum: 32},
  horizon: {minimum: 0},
  candidates: {minimum: 1},
  timeLimit: {minimum: 50},
  randomness: {minimum: 0, maximum: 100},
};

/** Range of the slider next to each admin field: a sensible span, the field itself accepts the full limits. */
export const RUST_BOT_STRENGTH_SLIDERS: Readonly<Record<RustBotStrengthField, {minimum: number, maximum: number, step: number}>> = {
  rollouts: {minimum: 1, maximum: 256, step: 1},
  threads: {minimum: 1, maximum: 32, step: 1},
  horizon: {minimum: 0, maximum: 10, step: 1},
  candidates: {minimum: 1, maximum: 20, step: 1},
  timeLimit: {minimum: 50, maximum: 5000, step: 50},
  randomness: {minimum: 0, maximum: 100, step: 1},
};

const KEY_PARTS: Record<RustBotStrengthField, string> = {
  rollouts: 'ROLLOUTS', threads: 'THREADS', horizon: 'HORIZON', candidates: 'CANDIDATES', timeLimit: 'THINKING_MS', randomness: 'RANDOMNESS',
};

/** Key in the server's .env, e.g. AI_HARD_ROLLOUTS. */
export function rustBotStrengthKey(level: AiLevel, field: RustBotStrengthField): string {
  return `AI_${level.toUpperCase()}_${KEY_PARTS[field]}`;
}

/**
 * Strength of a level: the admin's values where valid, the defaults elsewhere.
 *
 * processorCores: the cores of the machine the bot runs on. More threads than cores only make the threads wait
 * for each other, so the thread count never goes above it (the admin page shows the same limit).
 */
export function rustBotStrength(level: AiLevel, env: Readonly<Record<string, string | undefined>>, processorCores?: number): RustBotStrength {
  const strength: RustBotStrength = {...DEFAULT_RUST_BOT_STRENGTH[level]};
  for (const field of RUST_BOT_STRENGTH_FIELDS) {
    const raw = env[rustBotStrengthKey(level, field)];
    if (raw === undefined || raw.trim() === '' || !/^[0-9]+$/.test(raw.trim())) {
      continue;
    }
    const value = Number(raw);
    const {minimum, maximum} = RUST_BOT_STRENGTH_LIMITS[field];
    if (value >= minimum && (maximum === undefined || value <= maximum)) {
      strength[field] = value;
    }
  }
  if (processorCores !== undefined && processorCores >= 1) {
    strength.threads = Math.min(strength.threads, processorCores);
  }
  return strength;
}
