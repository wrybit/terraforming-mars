import {CreateGameModel} from './CreateGameModel';
import {defaultCreateGameModel} from './defaultCreateGameModel';

// Whether a collapsible card holds settings other than the default: then its closed head says so,
// so nobody overlooks a changed setting behind a closed card.

const DEFAULTS = defaultCreateGameModel();

// Options of the "Expansion options" card, by the expansion that shows them (hidden options do not count)
const EXPANSION_OPTION_KEYS = {
  venus: ['altVenusBoard', 'requiresVenusTrackCompletion'],
  turmoil: ['politicalAgendasExtension', 'removeNegativeGlobalEventsOption'],
  moon: ['requiresMoonTrackCompletion', 'moonStandardProjectVariant1', 'moonStandardProjectVariant'],
  ares: ['aresExtremeVariant'],
} as const satisfies Record<string, ReadonlyArray<keyof CreateGameModel>>;

const MILESTONE_KEYS = ['randomMA', 'modularMA', 'includeFanMA'] as const satisfies ReadonlyArray<keyof CreateGameModel>;

const CARD_POOL_LIST_KEYS = ['customCorporations', 'customPreludes', 'customCeos', 'customColonies', 'bannedCards', 'includedCards'] as const satisfies ReadonlyArray<keyof CreateGameModel>;

function differs(model: CreateGameModel, keys: ReadonlyArray<keyof CreateGameModel>): boolean {
  return keys.some((key) => model[key] !== DEFAULTS[key]);
}

export function expansionOptionsChanged(model: CreateGameModel): boolean {
  return (Object.keys(EXPANSION_OPTION_KEYS) as Array<keyof typeof EXPANSION_OPTION_KEYS>)
    .some((expansion) => model.expansions[expansion] && differs(model, EXPANSION_OPTION_KEYS[expansion]));
}

export function milestonesChanged(model: CreateGameModel): boolean {
  return differs(model, MILESTONE_KEYS);
}

export function cardPoolChanged(model: CreateGameModel): boolean {
  return model.seededGame || CARD_POOL_LIST_KEYS.some((key) => model[key].length > 0);
}
