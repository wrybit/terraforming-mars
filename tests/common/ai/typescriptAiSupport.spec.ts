import {expect} from 'chai';
import {BoardName} from '../../../src/common/boards/BoardName';
import {isAiCompatible} from '../../../src/common/ai/aiCompatibility';
import {TYPESCRIPT_AI_SUPPORT} from '../../../src/common/ai/typescript/typescriptAiSupport';

describe('TypeScript AI support', () => {
  it('allows the base game with corporate era, prelude, venus and promos on every board', () => {
    const settings = {expansions: {corpera: true, prelude: true, prelude2: true, venus: true, promo: true}, boardName: BoardName.HOLLANDIA, options: {draftVariant: true}};
    expect(isAiCompatible(settings, TYPESCRIPT_AI_SUPPORT)).deep.eq({ok: true, reasons: []});
  });

  it('names expansions and modes it cannot handle', () => {
    const settings = {expansions: {corpera: true, colonies: true, turmoil: true}, boardName: BoardName.THARSIS, options: {twoCorpsVariant: true}};
    expect(isAiCompatible(settings, TYPESCRIPT_AI_SUPPORT).reasons).deep.eq([
      {kind: 'expansion', id: 'colonies'},
      {kind: 'expansion', id: 'turmoil'},
      {kind: 'option', id: 'twoCorpsVariant'},
    ]);
  });
});
