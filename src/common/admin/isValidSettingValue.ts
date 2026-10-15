import {ServerSettingDefinition} from './serverSettings';

/**
 * Whether a value may be saved for the setting. Number settings take whole numbers only, at least their minimum:
 * the server reads them with parseInt, and e.g. "ten" days of MAX_GAME_DAYS used to become 0 = delete everything.
 * Choice settings take one of their values only. Empty means "not set" and is always allowed.
 */
export function isValidSettingValue(definition: ServerSettingDefinition, value: string | null): boolean {
  if (value === null || value === '') {
    return true;
  }
  if (definition.kind === 'choice') {
    return (definition.choices ?? []).some((choice) => choice.value === value);
  }
  if (definition.kind !== 'number') {
    return true;
  }
  return /^[0-9]+$/.test(value.trim()) && Number(value) >= (definition.minimum ?? 0);
}
