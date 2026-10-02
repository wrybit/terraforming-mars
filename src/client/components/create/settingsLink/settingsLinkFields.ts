import {CreateGameModel} from '../CreateGameModel';

// Feldreihenfolge des Teilen-Links – Vertrag zwischen Encoder und Decoder.
// Neue Felder nur HINTEN anhängen, nie umsortieren: sonst lesen alte Lesezeichen falsche Werte.

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

/** Nur im Link, wenn escapeVelocityMode an ist. */
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

/** Spieler-Bits im Link */
export const PLAYER_BEGINNER_FLAG = 1;
