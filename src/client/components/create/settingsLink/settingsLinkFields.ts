import {CreateGameModel} from '../CreateGameModel';

// Field order of the share link – contract between encoder and decoder.
// Only ever append new fields at the END, never reorder: otherwise old bookmarks read wrong values.

export const SETTINGS_LINK_FORMAT_VERSION = 1;

type BooleanModelField = {
  [Field in keyof CreateGameModel]: CreateGameModel[Field] extends boolean | undefined ? Field : never
}[keyof CreateGameModel];

type NumberModelField = {
  [Field in keyof CreateGameModel]: CreateGameModel[Field] extends number ? Field : never
}[keyof CreateGameModel];

export const BOOLEAN_FIELDS: ReadonlyArray<BooleanModelField> = [
  'draftVariant',
  'initialDraft',
  'preludeDraftVariant',
  'ceosDraftVariant',
  'randomFirstPlayer',
  'showOtherPlayersVP',
  'solarPhaseOption',
  'shuffleMapOption',
  'aresExtremeVariant',
  'undoOption',
  'showTimers',
  'fastModeOption',
  'removeNegativeGlobalEventsOption',
  'includeFanMA',
  'modularMA',
  'soloTR',
  'requiresVenusTrackCompletion',
  'requiresMoonTrackCompletion',
  'moonStandardProjectVariant',
  'moonStandardProjectVariant1',
  'altVenusBoard',
  'twoCorpsVariant',
  'escapeVelocityMode',
];

export const NUMBER_FIELDS: ReadonlyArray<NumberModelField> = [
  'startingCorporations',
  'startingPreludes',
  'startingCeos',
  'firstIndex',
];

/** Only in the link when escapeVelocityMode is on. */
export const ESCAPE_VELOCITY_FIELDS: ReadonlyArray<NumberModelField> = [
  'escapeVelocityThreshold',
  'escapeVelocityBonusSeconds',
  'escapeVelocityPeriod',
  'escapeVelocityPenalty',
];

export const CARD_LIST_FIELDS = [
  'customCorporations',
  'customPreludes',
  'customCeos',
  'bannedCards',
  'includedCards',
] as const satisfies ReadonlyArray<keyof CreateGameModel>;

/** Player bits in the link */
export const PLAYER_BEGINNER_FLAG = 1;
// Bits 1-2: AI level index + 1 (0 = human), so links without AI players stay unchanged
export const PLAYER_AI_LEVEL_SHIFT = 1;
export const PLAYER_AI_LEVEL_MASK = 0b110;
