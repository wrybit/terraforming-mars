import {durationToMilliseconds} from '../../utils/durations';

// How long a login stays valid: Discord sessions and the admin login cookie alike (SESSION_DURATION, e.g. 30d or 12h).
// An unreadable value falls back to the default instead of logging everybody out at once.
export const DEFAULT_SESSION_DURATION = '30d';

export function sessionDurationMilliseconds(value: string | undefined): number {
  const parsed = durationToMilliseconds(value || DEFAULT_SESSION_DURATION);
  return Number.isNaN(parsed) || parsed <= 0 ? durationToMilliseconds(DEFAULT_SESSION_DURATION) : parsed;
}

export const SESSION_DURATION_MILLISECONDS = sessionDurationMilliseconds(process.env.SESSION_DURATION);
