import {ServerSettingDefinition} from './serverSettings';
import {isValidGameQuotaLimit, parseGameQuota} from './gameQuota';

/**
 * Whether a value may be saved for the setting. Number settings take whole numbers only, at least their minimum:
 * the server reads them with parseInt, and e.g. "ten" days of MAX_GAME_DAYS used to become 0 = delete everything.
 * Choice settings take one of their values only. Empty means "not set" and is always allowed.
 */
export function isValidSettingValue(definition: ServerSettingDefinition, value: string | null): boolean {
  if (value === null || value === '') {
    return true;
  }
  if (definition.kind === 'choice' || definition.kind === 'segmented') {
    return (definition.choices ?? []).some((choice) => choice.value === value);
  }
  if (definition.kind === 'quota') {
    return parseGameQuota(value)?.every(isValidGameQuotaLimit) === true;
  }
  if (definition.kind !== 'number') {
    return true;
  }
  const number = Number(value);
  return /^[0-9]+$/.test(value.trim()) && number >= (definition.minimum ?? 0) && (definition.maximum === undefined || number <= definition.maximum);
}
