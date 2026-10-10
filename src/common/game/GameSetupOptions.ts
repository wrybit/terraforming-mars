import {AgendaStyle} from '../turmoil/Types';
import {RandomMAOptionType} from '../ma/RandomMAOptionType';
import {GameOptionsModel} from '../models/GameOptionsModel';
import {NewGameConfig} from './NewGameConfig';

// Contract for the setup chips: the create form (from its NewGameConfig) and the stats (from the finished game's
// GameOptionsModel) fill exactly this shape, so both show the same chips for the same settings.
export type GameSetupOptions = {
  shuffledBoard: boolean;
  // Expansion options (only meaningful with their expansion)
  altVenusBoard: boolean;
  requiresVenusTrackCompletion: boolean;
  politicalAgendasExtension: AgendaStyle;
  removeNegativeGlobalEvents: boolean;
  requiresMoonTrackCompletion: boolean;
  moonStandardProjectVariant1: boolean;
  moonStandardProjectVariant: boolean;
  aresExtremeVariant: boolean;
  // Setup
  // Undefined: not known (screenshots, old saved games)
  startingCorporations: number | undefined;
  startingPreludes: number | undefined;
  startingCeos: number | undefined;
  twoCorpsVariant: boolean;
  draftVariant: boolean;
  initialDraftVariant: boolean;
  preludeDraftVariant: boolean;
  ceosDraftVariant: boolean;
  // House rules and pace
  solarPhaseOption: boolean;
  soloTR: boolean;
  undoOption: boolean;
  showTimers: boolean;
  showOtherPlayersVP: boolean;
  fastModeOption: boolean;
  escapeVelocity: boolean;
  // Milestones & awards
  randomMA: RandomMAOptionType;
  modularMA: boolean;
  includeFanMA: boolean;
  // Card pool restricted or extended by hand
  customCardPool: boolean;
};

type CardPoolLists = {
  customCorporationsList: ReadonlyArray<unknown>;
  customPreludes: ReadonlyArray<unknown>;
  customCeos: ReadonlyArray<unknown>;
  customColoniesList: ReadonlyArray<unknown>;
  bannedCards: ReadonlyArray<unknown>;
  includedCards: ReadonlyArray<unknown>;
};

function customCardPool(lists: CardPoolLists): boolean {
  return [lists.customCorporationsList, lists.customPreludes, lists.customCeos, lists.customColoniesList, lists.bannedCards, lists.includedCards]
    .some((list) => list.length > 0);
}

// Create form: the settings it is about to send
export function setupOptionsFromConfig(config: NewGameConfig): GameSetupOptions {
  return {
    shuffledBoard: config.shuffleMapOption,
    altVenusBoard: config.altVenusBoard,
    requiresVenusTrackCompletion: config.requiresVenusTrackCompletion,
    politicalAgendasExtension: config.politicalAgendasExtension,
    removeNegativeGlobalEvents: config.removeNegativeGlobalEventsOption,
    requiresMoonTrackCompletion: config.requiresMoonTrackCompletion,
    moonStandardProjectVariant1: config.moonStandardProjectVariant1,
    moonStandardProjectVariant: config.moonStandardProjectVariant,
    aresExtremeVariant: config.aresExtremeVariant,
    startingCorporations: config.startingCorporations,
    startingPreludes: config.startingPreludes,
    startingCeos: config.startingCeos,
    twoCorpsVariant: config.twoCorpsVariant,
    draftVariant: config.draftVariant,
    initialDraftVariant: config.initialDraft,
    preludeDraftVariant: config.preludeDraftVariant,
    ceosDraftVariant: config.ceosDraftVariant,
    solarPhaseOption: config.solarPhaseOption,
    soloTR: config.soloTR,
    undoOption: config.undoOption,
    showTimers: config.showTimers,
    showOtherPlayersVP: config.showOtherPlayersVP,
    fastModeOption: config.fastModeOption,
    escapeVelocity: config.escapeVelocity !== undefined,
    randomMA: config.randomMA,
    modularMA: config.modularMA,
    includeFanMA: config.includeFanMA,
    customCardPool: customCardPool(config),
  };
}

// Stats: the options of a finished game. Older saved games may lack newer options: they count as off.
export function setupOptionsFromGame(options: GameOptionsModel): GameSetupOptions {
  return {
    shuffledBoard: options.shuffleMapOption === true,
    altVenusBoard: options.altVenusBoard === true,
    requiresVenusTrackCompletion: options.requiresVenusTrackCompletion === true,
    politicalAgendasExtension: options.politicalAgendasExtension ?? 'Standard',
    removeNegativeGlobalEvents: options.removeNegativeGlobalEvents === true,
    requiresMoonTrackCompletion: options.requiresMoonTrackCompletion === true,
    moonStandardProjectVariant1: options.moonStandardProjectVariant1 === true,
    moonStandardProjectVariant: options.moonStandardProjectVariant === true,
    aresExtremeVariant: options.aresExtremeVariant === true,
    startingCorporations: options.startingCorporations,
    startingPreludes: options.startingPreludes,
    startingCeos: options.startingCeos,
    twoCorpsVariant: options.twoCorpsVariant === true,
    draftVariant: options.draftVariant === true,
    initialDraftVariant: options.initialDraftVariant === true,
    preludeDraftVariant: options.preludeDraftVariant === true,
    ceosDraftVariant: options.ceosDraftVariant === true,
    solarPhaseOption: options.solarPhaseOption === true,
    soloTR: options.soloTR === true,
    undoOption: options.undoOption === true,
    showTimers: options.showTimers === true,
    showOtherPlayersVP: options.showOtherPlayersVP === true,
    fastModeOption: options.fastModeOption === true,
    escapeVelocity: options.escapeVelocity !== undefined,
    randomMA: options.randomMA ?? RandomMAOptionType.NONE,
    modularMA: options.modularMA === true,
    includeFanMA: options.includeFanMA === true,
    customCardPool: customCardPool({
      customCorporationsList: options.customCorporationsList ?? [],
      customPreludes: options.customPreludes ?? [],
      customCeos: options.customCeos ?? [],
      customColoniesList: options.customColoniesList ?? [],
      bannedCards: options.bannedCards ?? [],
      includedCards: options.includedCards ?? [],
    }),
  };
}
