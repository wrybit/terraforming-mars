// GAME_QUOTA in the .env stays JSON (the server reads it in ApiCreateGame.ts: one {"limit", "per"} object or a
// list of them); the admin page shows it as rows "5 games per 10 minutes". This file translates between both.

export type GameQuotaUnit = 'm' | 'h' | 'd';

export type GameQuotaLimit = {
  /** Games one address may create … */
  games: number,
  /** … per this many units */
  amount: number,
  unit: GameQuotaUnit,
};

export const GAME_QUOTA_UNITS: ReadonlyArray<{unit: GameQuotaUnit, label: string, minutes: number}> = [
  {unit: 'm', label: 'minutes', minutes: 1},
  {unit: 'h', label: 'hours', minutes: 60},
  {unit: 'd', label: 'days', minutes: 24 * 60},
];

const DURATION = /^(?:([0-9]+)[Dd])?(?:([0-9]+)[Hh])?(?:([0-9]+)[Mm])?(?:([0-9]+)[Ss])?$/;

/** "1h30m" → 90; seconds round up to whole minutes (the rows know no seconds); undefined when unreadable */
function durationMinutes(per: string): number | undefined {
  const match = DURATION.exec(per);
  if (match === null || match.slice(1).every((part) => part === undefined)) {
    return undefined;
  }
  const [days, hours, minutes, seconds] = match.slice(1).map((part) => Number(part ?? 0));
  const total = days * 24 * 60 + hours * 60 + minutes + Math.ceil(seconds / 60);
  return total > 0 ? total : undefined;
}

/** The largest unit that divides the span evenly: 1440 minutes read as "1 days", 90 as "90 minutes" */
function asLimit(games: number, minutes: number): GameQuotaLimit {
  const unit = [...GAME_QUOTA_UNITS].reverse().find((candidate) => minutes % candidate.minutes === 0) ?? GAME_QUOTA_UNITS[0];
  return {games, amount: minutes / unit.minutes, unit: unit.unit};
}

/** Rows of a stored value; [] for empty (unlimited), undefined when the value cannot be read */
export function parseGameQuota(value: string): Array<GameQuotaLimit> | undefined {
  if (value.trim() === '') {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return undefined;
  }
  const entries = Array.isArray(parsed) ? parsed : [parsed];
  const limits: Array<GameQuotaLimit> = [];
  for (const entry of entries) {
    const games = Number.parseInt(String((entry as {limit?: unknown})?.limit));
    const per = (entry as {per?: unknown})?.per;
    const minutes = typeof per === 'string' ? durationMinutes(per) : undefined;
    if (Number.isNaN(games) || games < 0 || minutes === undefined) {
      return undefined;
    }
    limits.push(asLimit(games, minutes));
  }
  return limits;
}

/** Value for the .env: '' without rows (unlimited), otherwise always the list form */
export function formatGameQuota(limits: ReadonlyArray<GameQuotaLimit>): string {
  if (limits.length === 0) {
    return '';
  }
  return JSON.stringify(limits.map((limit) => ({limit: limit.games, per: `${limit.amount}${limit.unit}`})));
}

/** Whole numbers only: games from 0, spans from 1 */
export function isValidGameQuotaLimit(limit: GameQuotaLimit): boolean {
  return Number.isInteger(limit.games) && limit.games >= 0 && Number.isInteger(limit.amount) && limit.amount >= 1 &&
    GAME_QUOTA_UNITS.some((unit) => unit.unit === limit.unit);
}
