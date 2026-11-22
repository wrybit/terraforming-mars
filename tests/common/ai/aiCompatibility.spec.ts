import {expect} from 'chai';
import {BoardName} from '../../../src/common/boards/BoardName';
import {EMPTY_AI_SUPPORT, AiSupport} from '../../../src/common/ai/aiSupportContract';
import {AiSettings, aiEngineFor, isAiCompatible, aiSettingsOf, playableAiSupport} from '../../../src/common/ai/aiCompatibility';
import {NewGameConfig} from '../../../src/common/game/NewGameConfig';
import {RandomMAOptionType} from '../../../src/common/ma/RandomMAOptionType';

const SUPPORT: AiSupport = {
  ...EMPTY_AI_SUPPORT,
  expansions: ['corpera', 'prelude'],
  boards: [BoardName.THARSIS],
  options: ['draftVariant'],
};

const SETTINGS: AiSettings = {
  expansions: {corpera: true, prelude: true, venus: false},
  boardName: BoardName.THARSIS,
  options: {draftVariant: true, soloTR: false},
};

describe('isAiCompatible', () => {
  it('is ok with supported settings only', () => {
    expect(isAiCompatible(SETTINGS, SUPPORT)).deep.eq({ok: true, reasons: []});
  });

  it('names every unsupported setting', () => {
    const settings: AiSettings = {
      expansions: {...SETTINGS.expansions, venus: true},
      boardName: BoardName.HELLAS,
      options: {draftVariant: true, solarPhaseOption: true},
    };
    expect(isAiCompatible(settings, SUPPORT)).deep.eq({ok: false, reasons: [
      {kind: 'expansion', id: 'venus'},
      {kind: 'board', id: BoardName.HELLAS},
      {kind: 'option', id: 'solarPhaseOption'},
    ]});
  });

  it('supports nothing without a file, but the base game alone on an unknown board passes', () => {
    expect(isAiCompatible(SETTINGS, EMPTY_AI_SUPPORT).ok).is.false;
    expect(isAiCompatible({expansions: {}, boardName: undefined, options: {}}, EMPTY_AI_SUPPORT).ok).is.true;
  });
});

describe('aiSettingsOf', () => {
  const config = {
    players: [{}, {}],
    expansions: {corpera: true, prelude: false, venus: false, ceo: false},
    draftVariant: true,
    initialDraft: true,
    preludeDraftVariant: true,
    soloTR: true,
    showTimers: true,
    undoOption: true,
    fastModeOption: true,
    showOtherPlayersVP: true,
    aiAnalysis: true,
    altVenusBoard: true,
    randomMA: RandomMAOptionType.NONE,
    includeFanMA: true,
  } as unknown as NewGameConfig;

  it('counts only options that take effect and never pure display options', () => {
    const options = aiSettingsOf(config, BoardName.THARSIS).options;
    expect(Object.entries(options).filter(([, enabled]) => enabled).map(([option]) => option)).deep.eq(['draftVariant', 'initialDraftVariant']);
  });

  it('counts the 63 TR mode solo and no draft there', () => {
    const options = aiSettingsOf({...config, players: [config.players[0]]}, BoardName.THARSIS).options;
    expect(Object.entries(options).filter(([, enabled]) => enabled).map(([option]) => option)).deep.eq(['soloTR']);
  });
});

describe('aiEngineFor', () => {
  const typescript: AiSupport = {...EMPTY_AI_SUPPORT, expansions: ['corpera', 'venus'], boards: [BoardName.THARSIS], options: ['draftVariant']};
  const rust: AiSupport = {...EMPTY_AI_SUPPORT, expansions: ['corpera', 'colonies'], boards: [BoardName.THARSIS], options: ['draftVariant']};
  const supports = {rust, typescript};
  const base: AiSettings = {expansions: {corpera: true}, boardName: BoardName.THARSIS, options: {draftVariant: true}};
  const venus: AiSettings = {...base, expansions: {corpera: true, venus: true}};
  const colonies: AiSettings = {...base, expansions: {corpera: true, colonies: true}};

  it('plays the TypeScript AI while the admin chose it', () => {
    expect(aiEngineFor(base, supports, {engine: 'typescript', typescriptFallback: true})).deep.eq({engine: 'typescript', reasons: []});
    expect(aiEngineFor(colonies, supports, {engine: 'typescript', typescriptFallback: true}))
      .deep.eq({engine: 'none', reasons: [{kind: 'expansion', id: 'colonies'}]});
  });

  it('plays the Rust AI where it can', () => {
    expect(aiEngineFor(colonies, supports, {engine: 'rust', typescriptFallback: false}).engine).eq('rust');
  });

  it('lets the TypeScript AI stand in with the stand-in switched on, and names why', () => {
    expect(aiEngineFor(venus, supports, {engine: 'rust', typescriptFallback: true}))
      .deep.eq({engine: 'typescript', reasons: [{kind: 'expansion', id: 'venus'}]});
  });

  it('has no AI without the stand-in, or where neither AI can play', () => {
    expect(aiEngineFor(venus, supports, {engine: 'rust', typescriptFallback: false}))
      .deep.eq({engine: 'none', reasons: [{kind: 'expansion', id: 'venus'}]});
    const both: AiSettings = {...base, expansions: {corpera: true, venus: true, colonies: true}};
    expect(aiEngineFor(both, supports, {engine: 'rust', typescriptFallback: true}))
      .deep.eq({engine: 'none', reasons: [{kind: 'expansion', id: 'colonies'}]});
  });

  it('plays nothing with Rust without a support file and without the stand-in', () => {
    expect(aiEngineFor(base, {rust: EMPTY_AI_SUPPORT, typescript}, {engine: 'rust', typescriptFallback: false}).engine).eq('none');
    expect(aiEngineFor(base, {rust: EMPTY_AI_SUPPORT, typescript}, {engine: 'rust', typescriptFallback: true}).engine).eq('typescript');
  });
});

describe('playableAiSupport', () => {
  const typescript: AiSupport = {...EMPTY_AI_SUPPORT, expansions: ['corpera', 'venus']};
  const rust: AiSupport = {...EMPTY_AI_SUPPORT, expansions: ['corpera', 'colonies']};

  it('is the support of the AI that plays, both together with the stand-in', () => {
    expect(playableAiSupport({rust, typescript}, {engine: 'typescript', typescriptFallback: true}).expansions).deep.eq(['corpera', 'venus']);
    expect(playableAiSupport({rust, typescript}, {engine: 'rust', typescriptFallback: false}).expansions).deep.eq(['corpera', 'colonies']);
    expect(playableAiSupport({rust, typescript}, {engine: 'rust', typescriptFallback: true}).expansions).deep.eq(['corpera', 'colonies', 'venus']);
  });
});
