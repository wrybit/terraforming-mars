import {NewGameConfig} from '../game/NewGameConfig';
import {RandomMAOptionType} from '../ma/RandomMAOptionType';

/**
 * Settings of a new game the Rust AI cannot mirror yet, beyond expansions, boards and options of its support file.
 *
 * The server checks the same settings again when the game starts (server/ai/rust/rustSetup.ts rustOptionsText);
 * this list lets the create form and the lobby refuse AI seats up front instead of the AI disappearing silently.
 */
export const AI_SETUP_LIMITS = [
  'noCorporateEra',
  'customCorporations',
  'customPreludes',
  'customCeos',
  'customColonies',
  'bannedCards',
  'includedCards',
  'manualMilestones',
  'escapeVelocity',
  'predefinedGame',
] as const;
export type AiSetupLimit = typeof AI_SETUP_LIMITS[number];

/** The limits a create request runs into; empty when the Rust AI can mirror its setup. */
export function aiSetupLimitsOf(config: NewGameConfig): Array<AiSetupLimit> {
  const filled = (list: ReadonlyArray<unknown> | undefined) => list !== undefined && list.length > 0;
  const limits: Array<AiSetupLimit> = [];
  if (config.expansions.corpera !== true) {
    limits.push('noCorporateEra');
  }
  if (filled(config.customCorporationsList)) {
    limits.push('customCorporations');
  }
  if (filled(config.customPreludes)) {
    limits.push('customPreludes');
  }
  if (filled(config.customCeos)) {
    limits.push('customCeos');
  }
  if (filled(config.customColoniesList)) {
    limits.push('customColonies');
  }
  if (filled(config.bannedCards)) {
    limits.push('bannedCards');
  }
  if (filled(config.includedCards)) {
    limits.push('includedCards');
  }
  if (config.randomMA === RandomMAOptionType.MANUAL || config.customMA !== undefined) {
    limits.push('manualMilestones');
  }
  if (config.escapeVelocity !== undefined) {
    limits.push('escapeVelocity');
  }
  // A copy of an existing game starts in its past, the Rust AI cannot mirror it ('#' ids create a fresh game)
  // The form may send an empty text although the type promises a game id
  const cloned: string = config.clonedGamedId ?? '';
  if (cloned !== '' && !cloned.startsWith('#')) {
    limits.push('predefinedGame');
  }
  return limits;
}
