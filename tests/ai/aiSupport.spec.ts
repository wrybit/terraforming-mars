import {expect} from 'chai';
import {aiUnsupportedReasons} from '../../src/common/ai/aiSupport';

describe('AI support of game settings', () => {
  it('allows the base game with corporate era, prelude, venus and promos', () => {
    expect(aiUnsupportedReasons({expansions: {corpera: true, prelude: true, prelude2: true, venus: true, promo: true}})).deep.eq([]);
  });

  it('names expansions and modes the AI cannot handle', () => {
    expect(aiUnsupportedReasons({expansions: {corpera: true, colonies: true, turmoil: true}, twoCorpsVariant: true}))
      .deep.eq(['Colonies', 'Turmoil', 'Merger']);
  });
});
