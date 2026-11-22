import {expect} from 'chai';
import {BoardName} from '../../../src/common/boards/BoardName';
import {EMPTY_RUST_AI_SUPPORT, RustAiSupport} from '../../../src/common/ai/RustAiSupport';
import {RustAiSettings} from '../../../src/common/ai/isRustAiCompatible';
import {fallBackToClassicAi} from '../../../src/server/ai/rust/rustAiFallback';

const SUPPORT: RustAiSupport = {...EMPTY_RUST_AI_SUPPORT, expansions: ['corpera'], boards: [BoardName.THARSIS]};
const SETTINGS: RustAiSettings = {expansions: {corpera: true}, boardName: BoardName.THARSIS, options: {}};

describe('fallBackToClassicAi', () => {
  let log: typeof console.log;

  beforeEach(() => {
    log = console.log;
    console.log = () => {};
  });

  afterEach(() => {
    console.log = log;
  });

  it('keeps the new AI with supported settings', () => {
    const players = [{name: 'Paul', aiEngine: 'rust'}];
    expect(fallBackToClassicAi(players, SETTINGS, SUPPORT)).deep.eq([]);
    expect(players[0].aiEngine).eq('rust');
  });

  it('switches new AI seats to the classic AI and names the reason', () => {
    const players = [{name: 'Jens', aiEngine: undefined}, {name: 'Paul', aiEngine: 'rust'}, {name: 'Alia', aiEngine: 'ts'}];
    const reasons = fallBackToClassicAi(players, {...SETTINGS, expansions: {corpera: true, venus: true}}, SUPPORT);
    expect(reasons).deep.eq([{kind: 'expansion', id: 'venus'}]);
    expect(players.map((player) => player.aiEngine)).deep.eq([undefined, undefined, 'ts']);
  });
});
