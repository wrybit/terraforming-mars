import {NewGameConfig} from '../game/NewGameConfig';
import {RandomMAOptionType} from '../ma/RandomMAOptionType';
import {CardName} from '../cards/CardName';
import {GameModule} from '../cards/GameModule';

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
  'includedCards',
  'manualMilestones',
  'escapeVelocity',
  'predefinedGame',
] as const;
export type AiSetupLimit = typeof AI_SETUP_LIMITS[number];

/**
 * Card lists the Rust AI plays as long as it knows every listed card: the server deals from them and hands the bot the
 * dealt cards and piles (rustSetup.ts setupOf). Excluded cards only leave the deck and never stop the AI.
 */
export const AI_CARD_LISTS = ['customCorporations', 'customPreludes', 'includedCards'] as const;
export type AiCardList = typeof AI_CARD_LISTS[number];

/** Expansion of each card of the card lists (undefined: unknown card), checked against the AI's expansions. */
export type AiCardListModules = Record<AiCardList, Array<GameModule | undefined>>;

/** Looks up the expansion of a card: the create form from its card data, the server from its card manifests. */
export type CardModuleLookup = (card: CardName) => GameModule | undefined;

export function aiCardListModules(config: NewGameConfig, moduleOf: CardModuleLookup): AiCardListModules {
  const modules = (list: ReadonlyArray<CardName> | undefined) => (list ?? []).map(moduleOf);
  return {
    customCorporations: modules(config.customCorporationsList),
    customPreludes: modules(config.customPreludes),
    includedCards: modules(config.includedCards),
  };
}

/** The card lists holding a card of an expansion the AI does not play (or an unknown card). */
export function aiCardListLimits(lists: AiCardListModules, expansions: ReadonlyArray<string>): Array<AiCardList> {
  const known = (module: GameModule | undefined) => module === 'base' || (module !== undefined && expansions.includes(module));
  return AI_CARD_LISTS.filter((list) => !lists[list].every(known));
}

/** The limits a create request runs into regardless of its cards (card lists: aiCardListLimits). */
export function aiSetupLimitsOf(config: NewGameConfig): Array<AiSetupLimit> {
  const filled = (list: ReadonlyArray<unknown> | undefined) => list !== undefined && list.length > 0;
  const limits: Array<AiSetupLimit> = [];
  if (config.expansions.corpera !== true) {
    limits.push('noCorporateEra');
  }
  if (filled(config.customCeos)) {
    limits.push('customCeos');
  }
  if (filled(config.customColoniesList)) {
    limits.push('customColonies');
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
