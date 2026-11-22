import {expect} from 'chai';
import {BoardName} from '../../../src/common/boards/BoardName';
import {EMPTY_RUST_AI_SUPPORT, RustAiSupport} from '../../../src/common/ai/RustAiSupport';
import {RustAiSettings, isRustAiCompatible, rustAiSettingsOf} from '../../../src/common/ai/isRustAiCompatible';
import {NewGameConfig} from '../../../src/common/game/NewGameConfig';
import {RandomMAOptionType} from '../../../src/common/ma/RandomMAOptionType';

const SUPPORT: RustAiSupport = {
  ...EMPTY_RUST_AI_SUPPORT,
  expansions: ['corpera', 'prelude'],
  boards: [BoardName.THARSIS],
  options: ['draftVariant'],
};

const SETTINGS: RustAiSettings = {
  expansions: {corpera: true, prelude: true, venus: false},
  boardName: BoardName.THARSIS,
  options: {draftVariant: true, soloTR: false},
};

describe('isRustAiCompatible', () => {
  it('is ok with supported settings only', () => {
    expect(isRustAiCompatible(SETTINGS, SUPPORT)).deep.eq({ok: true, reasons: []});
  });

  it('names every unsupported setting', () => {
    const settings: RustAiSettings = {
      expansions: {...SETTINGS.expansions, venus: true},
      boardName: BoardName.HELLAS,
      options: {draftVariant: true, solarPhaseOption: true},
    };
    expect(isRustAiCompatible(settings, SUPPORT)).deep.eq({ok: false, reasons: [
      {kind: 'expansion', id: 'venus'},
      {kind: 'board', id: BoardName.HELLAS},
      {kind: 'option', id: 'solarPhaseOption'},
    ]});
  });

  it('supports nothing without a file, but the base game alone on an unknown board passes', () => {
    expect(isRustAiCompatible(SETTINGS, EMPTY_RUST_AI_SUPPORT).ok).is.false;
    expect(isRustAiCompatible({expansions: {}, boardName: undefined, options: {}}, EMPTY_RUST_AI_SUPPORT).ok).is.true;
  });
});

describe('rustAiSettingsOf', () => {
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
    const options = rustAiSettingsOf(config, BoardName.THARSIS).options;
    expect(Object.entries(options).filter(([, enabled]) => enabled).map(([option]) => option)).deep.eq(['draftVariant', 'initialDraftVariant']);
  });

  it('counts the 63 TR mode solo and no draft there', () => {
    const options = rustAiSettingsOf({...config, players: [config.players[0]]}, BoardName.THARSIS).options;
    expect(Object.entries(options).filter(([, enabled]) => enabled).map(([option]) => option)).deep.eq(['soloTR']);
  });
});
