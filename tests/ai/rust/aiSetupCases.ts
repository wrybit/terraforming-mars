// Setups the create form can send with AI seats, for the end-to-end test with the real Rust bot.
// Built from the bot's support file: every expansion, board and option it reports alone and in pairs (settings that
// work alone can still clash, 26.11.2026: Merger with the prelude draft), all at once, player counts, the card pool
// lists and the setup players actually created (custom corporation and prelude lists, excluded cards, Merger,
// 5 corporations, 8 preludes).
import {AiOption, AiSupport} from '../../../src/common/ai/aiSupportContract';
import {BoardName} from '../../../src/common/boards/BoardName';
import {CardName} from '../../../src/common/cards/CardName';
import {NewGameConfig} from '../../../src/common/game/NewGameConfig';
import {newGameConfigForTest} from '../../routes/newGameConfigForTest';

export type AiSetupCase = {
  label: string;
  board?: BoardName;
  /** The form must offer the AI here; otherwise the case only checks that what the form offers also plays */
  mustOfferAi: boolean;
  config: NewGameConfig;
  /** Plays only up to this generation (pairs: setups that clash show up early); without it to the end */
  untilGeneration?: number;
  /**
   * A known bug of the bot that still breaks this case: the case must still fail with it (once fixed, the test says
   * so and the mark goes). Listed, never skipped, so the gap stays visible.
   */
  knownIssue?: string;
};

// Known bugs of the bot, by case label
// (26.11.: the 6-player deck-out desync went away with the bot fix for ocean placements asked of another seat)
const KNOWN_ISSUES: Record<string, string> = {};

// Pairs are many; their clashes show in the setup and the first generations (Merger with the prelude draft: generation 1)
const PAIR_GENERATIONS = 3;

const CORPORATIONS = [CardName.CREDICOR, CardName.ECOLINE, CardName.HELION, CardName.INTERPLANETARY_CINEMATICS, CardName.INVENTRIX,
  CardName.MINING_GUILD, CardName.PHOBOLOG, CardName.THARSIS_REPUBLIC, CardName.THORGATE, CardName.UNITED_NATIONS_MARS_INITIATIVE,
  CardName.SATURN_SYSTEMS, CardName.TERACTOR];
const PRELUDES = [CardName.ALLIED_BANK, CardName.BIOSPHERE_SUPPORT, CardName.BUSINESS_EMPIRE, CardName.DOME_FARMING,
  CardName.DONATION, CardName.EARLY_SETTLEMENT, CardName.ECOLOGY_EXPERTS, CardName.EXPERIMENTAL_FOREST, CardName.GALILEAN_MINING,
  CardName.HUGE_ASTEROID, CardName.IO_RESEARCH_OUTPOST, CardName.LOAN, CardName.METAL_RICH_ASTEROID, CardName.METALS_COMPANY,
  CardName.MINING_OPERATIONS, CardName.MOHOLE, CardName.NITROGEN_SHIPMENT, CardName.ORBITAL_CONSTRUCTION_YARD,
  CardName.POLAR_INDUSTRIES, CardName.POWER_GENERATION, CardName.RESEARCH_NETWORK, CardName.SELF_SUFFICIENT_SETTLEMENT,
  CardName.SMELTING_PLANT, CardName.SOCIETY_SUPPORT, CardName.SUPPLIER, CardName.SUPPLY_DROP, CardName.UNMI_CONTRACTOR];
const BANNED = [CardName.PERMAFROST_EXTRACTION, CardName.BIG_ASTEROID, CardName.ANTS];

// Name of an option in the create request, where it differs from the AI option
const REQUEST_FIELD: Partial<Record<AiOption, string>> = {initialDraftVariant: 'initialDraft'};

/** `humans` human and `ai` AI seats; one human with one AI is the "Solo + AI" game of the form. */
function base(support: AiSupport, humans = 1, ai = 1): NewGameConfig {
  const colors = ['red', 'green', 'yellow', 'blue', 'black', 'purple'] as const;
  const players = [];
  for (let index = 0; index < humans + ai; index++) {
    players.push({name: `Seat ${index + 1}`, color: colors[index], beginner: false, handicap: 0, first: index === 0,
      aiLevel: index >= humans ? 'easy' as const : undefined});
  }
  const config = {...newGameConfigForTest(), players};
  config.draftVariant = support.options.includes('draftVariant');
  config.startingCorporations = 2;
  config.startingPreludes = 4;
  config.expansions = {...config.expansions, prelude: support.expansions.includes('prelude')};
  return config;
}

type Feature = {label: string, apply: (config: NewGameConfig) => void};

function features(support: AiSupport): Array<Feature> {
  const result: Array<Feature> = [];
  for (const expansion of support.expansions.filter((expansion) => expansion !== 'corpera')) {
    result.push({label: `expansion ${expansion}`, apply: (config) => config.expansions = {...config.expansions, [expansion]: true}});
  }
  for (const option of support.options) {
    result.push({label: `option ${option}`, apply: (config) => (config as unknown as Record<string, unknown>)[REQUEST_FIELD[option] ?? option] = true});
  }
  // The prelude draft only takes effect after the initial draft (aiOptionsInEffect)
  if (support.options.includes('initialDraftVariant') && support.options.includes('preludeDraftVariant')) {
    result.push({label: 'initial and prelude draft', apply: (config) => {
      config.initialDraft = true;
      config.preludeDraftVariant = true;
    }});
  }
  if (support.botFeatures.includes('noCorporateEra')) {
    result.push({label: 'without Corporate Era', apply: (config) => config.expansions = {...config.expansions, corpera: false}});
  }
  result.push({label: '5 corporations, 8 preludes', apply: (config) => {
    config.startingCorporations = 5;
    config.startingPreludes = 8;
  }});
  return result;
}

function everything(support: AiSupport, humans = 1, ai = 1): NewGameConfig {
  const config = base(support, humans, ai);
  features(support).filter((feature) => feature.label !== 'without Corporate Era').forEach((feature) => feature.apply(config));
  return config;
}

export function aiSetupCases(support: AiSupport): Array<AiSetupCase> {
  const cases: Array<AiSetupCase> = [];
  const all = features(support);
  for (const feature of all) {
    const config = base(support);
    feature.apply(config);
    cases.push({label: feature.label, mustOfferAi: true, config});
  }
  for (let first = 0; first < all.length; first++) {
    for (let second = first + 1; second < all.length; second++) {
      const config = base(support);
      all[first].apply(config);
      all[second].apply(config);
      cases.push({label: `${all[first].label} + ${all[second].label}`, mustOfferAi: true, config, untilGeneration: PAIR_GENERATIONS});
    }
  }
  for (const board of [BoardName.THARSIS, BoardName.HELLAS, BoardName.ELYSIUM, BoardName.UTOPIA_PLANITIA]) {
    cases.push({label: `board ${board}, everything`, board, mustOfferAi: false, config: everything(support)});
  }
  for (const [humans, ai] of [[1, 2], [1, 3], [2, 1], [2, 2], [1, 5]]) {
    cases.push({label: `${humans} human, ${ai} AI, everything`, mustOfferAi: true, config: everything(support, humans, ai)});
  }
  cases.push({label: 'everything the bot reports at once', mustOfferAi: true, config: everything(support)});
  cases.push({label: 'custom corporation list', mustOfferAi: true, config: {...everything(support), customCorporationsList: CORPORATIONS}});
  cases.push({label: 'custom prelude list', mustOfferAi: true, config: {...everything(support), customPreludes: PRELUDES}});
  cases.push({label: 'excluded cards', mustOfferAi: true, config: {...everything(support), bannedCards: BANNED}});
  const players: NewGameConfig = {...everything(support), twoCorpsVariant: true, startingCorporations: 5, startingPreludes: 8,
    undoOption: true, showTimers: true, solarPhaseOption: false, customCorporationsList: CORPORATIONS, customPreludes: PRELUDES, bannedCards: BANNED};
  cases.push({label: 'players\' setup: official expansions, Merger, 5 corporations, 8 preludes, card pool lists', mustOfferAi: true, config: players});
  return cases.map((testCase) => KNOWN_ISSUES[testCase.label] === undefined ? testCase : {...testCase, knownIssue: KNOWN_ISSUES[testCase.label]});
}
