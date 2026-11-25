import {expect} from 'chai';
import {BoardName} from '../../../src/common/boards/BoardName';
import {AI_SETUP_LIMITS, AiSetupLimit, aiSetupLimitsOf} from '../../../src/common/ai/aiSetupLimits';
import {aiEngineFor, aiSettingsOf} from '../../../src/common/ai/aiCompatibility';
import {EMPTY_AI_SUPPORT, AiSupport} from '../../../src/common/ai/aiSupportContract';
import {NewGameConfig} from '../../../src/common/game/NewGameConfig';
import {RandomMAOptionType} from '../../../src/common/ma/RandomMAOptionType';
import {CardName} from '../../../src/common/cards/CardName';
import {ColonyName} from '../../../src/common/colonies/ColonyName';
import {GameId} from '../../../src/common/Types';
import {ApiCreateGame} from '../../../src/server/routes/ApiCreateGame';
import {rustOptionsText} from '../../../src/server/ai/rust/rustSetup';

// A two-player create request the Rust AI can mirror: Tharsis, Corporate Era, nothing custom
function config(changes: Partial<NewGameConfig> = {}): NewGameConfig {
  return {
    players: [{name: 'Human', color: 'red', beginner: false, handicap: 0, first: true}, {name: 'Bot', color: 'blue', beginner: false, handicap: 0, first: false, aiLevel: 'hard'}],
    expansions: {corpera: true, promo: false, venus: false, colonies: false, prelude: false, prelude2: false, turmoil: false, community: false,
      ares: false, moon: false, pathfinders: false, ceo: false, starwars: false, underworld: false, deltaProject: false},
    boards: [BoardName.THARSIS], seed: 0, randomFirstPlayer: false, clonedGamedId: undefined, undoOption: false, showTimers: false,
    fastModeOption: false, showOtherPlayersVP: false, aresExtremeVariant: false, politicalAgendasExtension: 'Standard',
    solarPhaseOption: false, removeNegativeGlobalEventsOption: false, modularMA: false, draftVariant: false, initialDraft: false,
    preludeDraftVariant: false, ceosDraftVariant: false, startingCorporations: 2, shuffleMapOption: false,
    randomMA: RandomMAOptionType.NONE, includeFanMA: false, soloTR: false, customCorporationsList: [], bannedCards: [], includedCards: [],
    customColoniesList: [], customPreludes: [], requiresMoonTrackCompletion: false, requiresVenusTrackCompletion: false,
    moonStandardProjectVariant: false, moonStandardProjectVariant1: false, altVenusBoard: false, escapeVelocity: undefined,
    twoCorpsVariant: false, customCeos: [], startingCeos: 3, startingPreludes: 4,
    ...changes,
  } as NewGameConfig;
}

// One request per limit, as the create form sends it
const CHANGES: Record<AiSetupLimit, Partial<NewGameConfig>> = {
  noCorporateEra: {expansions: {...config().expansions, corpera: false}},
  customCorporations: {customCorporationsList: [CardName.CREDICOR]},
  customPreludes: {customPreludes: [CardName.DONATION]},
  customCeos: {customCeos: [CardName.FLOYD]},
  customColonies: {customColoniesList: [ColonyName.EUROPA]},
  bannedCards: {bannedCards: [CardName.ALGAE]},
  includedCards: {includedCards: [CardName.ALGAE]},
  manualMilestones: {randomMA: RandomMAOptionType.MANUAL},
  escapeVelocity: {escapeVelocity: {thresholdMinutes: 30, bonusSectionsPerAction: 1, penaltyPeriodMinutes: 2, penaltyVPPerPeriod: 1}},
  predefinedGame: {clonedGamedId: 'g123456789ab' as GameId},
};

describe('aiSetupLimitsOf', () => {
  it('finds nothing in a setup the Rust AI mirrors', () => {
    expect(aiSetupLimitsOf(config())).deep.eq([]);
  });

  it('names each limit of its own request', () => {
    for (const limit of AI_SETUP_LIMITS) {
      expect(aiSetupLimitsOf(config(CHANGES[limit])), limit).deep.eq([limit]);
    }
  });

  it('agrees with the server\'s setup check of the Rust mirror (no silent TypeScript AI)', () => {
    expect(rustOptionsText(ApiCreateGame.gameOptions(config(), BoardName.THARSIS), 2)).has.property('text');
    // A copied game never reaches the mirror: the create route builds it from the old game (ApiCreateGame.ts)
    for (const limit of AI_SETUP_LIMITS.filter((limit) => limit !== 'predefinedGame')) {
      const options = ApiCreateGame.gameOptions(config(CHANGES[limit]), BoardName.THARSIS);
      expect(rustOptionsText(options, 2), limit).has.property('unsupported');
    }
  });
});

describe('aiEngineFor with setup limits', () => {
  const support: AiSupport = {...EMPTY_AI_SUPPORT, expansions: ['corpera'], boards: [BoardName.THARSIS]};
  const supports = {rust: support, typescript: support};

  it('gives no AI where the Rust AI cannot mirror the setup, and names why', () => {
    const settings = aiSettingsOf(config({bannedCards: [CardName.ALGAE]}), BoardName.THARSIS);
    expect(aiEngineFor(settings, supports, {engine: 'rust', typescriptFallback: false}))
      .deep.eq({engine: 'none', reasons: [{kind: 'setup', id: 'bannedCards'}]});
  });

  it('plays the Rust AI without such settings', () => {
    expect(aiEngineFor(aiSettingsOf(config(), BoardName.THARSIS), supports, {engine: 'rust', typescriptFallback: false}).engine).eq('rust');
  });

  it('keeps the limits out of the TypeScript AI\'s own check', () => {
    const settings = aiSettingsOf(config({customCorporationsList: [CardName.CREDICOR]}), BoardName.THARSIS);
    expect(aiEngineFor(settings, supports, {engine: 'typescript', typescriptFallback: false}).engine).eq('typescript');
  });
});
