import {serverSettingDefinition} from '../../common/admin/serverSettings';
import {isValidSettingValue} from '../../common/admin/isValidSettingValue';
/**
 * Adds `days` days to `date`. `days can be negative.
 * @param date a valid date
 * @param days a number of days
 * @returns date + days (in days)
 */
export function addDays(date: Date, days: number) {
  const ms = Math.round(date.getTime());
  const daysInMs = days * 86400 * 1000;
  return new Date(ms + daysInMs);
}

export function dateToSeconds(date: Date) {
  return Math.round(date.getTime() / 1000);
}

export function stringToNumber(s: string | undefined, defaultValue: number): number {
  if (s === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(s);
  return Number.isInteger(parsed) ? parsed : defaultValue;
}

export function stringToBoolean(s: string | undefined, defaultValue: boolean): boolean {
  if (s === undefined) {
    return defaultValue;
  }
  if (s === 'true') {
    return true;
  }
  if (s === 'false') {
    return false;
  }
  const parsed = parseInt(s);
  return Number.isInteger(parsed) ? parsed > 0 : defaultValue;
}

export function daysAgoToSeconds(dayString: string | undefined, defaultValue: number): number {
  const days = stringToNumber(dayString, defaultValue);
  const date = addDays(new Date(), -days);
  return dateToSeconds(date);
}

/**
 * Whether the clean-up may use a number of days from the .env (deleting or shrinking games).
 * Not set: yes, the database applies its default. Otherwise the same rule as the admin page (whole number,
 * at least 1 day) – anything else
 * (a typo like "ten", 0, a fraction) used to become 0 days = "everything is old enough", so it is skipped.
 */
export function isUsableDaysSetting(name: string, environment: Record<string, string | undefined> = process.env): boolean {
  const value = environment[name];
  if (value === undefined) {
    return true;
  }
  const definition = serverSettingDefinition(name);
  if (definition !== undefined && isValidSettingValue(definition, value)) {
    return true;
  }
  console.warn(`${name}=${value} is not a whole number of at least 1: this clean-up is skipped`);
  return false;
}
