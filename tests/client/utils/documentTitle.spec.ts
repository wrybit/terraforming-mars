import {expect} from 'chai';
import {gameDocumentTitle, shortDocumentTitle, turnTitleState} from '@/client/utils/documentTitle';
import {Phase} from '@/common/Phase';

const game = {name: 'Remote Plasma Trace', generation: 2, phase: Phase.RESEARCH};

describe('documentTitle', () => {
  it('shows task, player, generation and name on own turn', () => {
    expect(gameDocumentTitle({game, thisPlayer: {name: 'Daniel'}, waitingFor: {}}))
      .to.eq('● Buying · Daniel · G2 · Remote Plasma Trace | TM');
  });

  it('omits task when not on turn or input is optional', () => {
    expect(gameDocumentTitle({game, thisPlayer: {name: 'Daniel'}})).to.eq('Daniel · G2 · Remote Plasma Trace | TM');
    expect(gameDocumentTitle({game, thisPlayer: {name: 'Daniel'}, waitingFor: {optional: true}})).to.eq('Daniel · G2 · Remote Plasma Trace | TM');
  });

  it('omits player for spectators', () => {
    expect(gameDocumentTitle({game})).to.eq('G2 · Remote Plasma Trace | TM');
  });

  it('accepts animated marker and explicit state', () => {
    const view = {game: {...game, phase: Phase.ACTION}, waitingFor: {}};
    expect(gameDocumentTitle(view, turnTitleState(view, '◑'))).to.eq('◑ Play · G2 · Remote Plasma Trace | TM');
    expect(gameDocumentTitle({game}, '🏁')).to.eq('🏁 · G2 · Remote Plasma Trace | TM');
  });
});

describe('shortDocumentTitle', () => {
  it('joins non-empty parts', () => {
    expect(shortDocumentTitle(['Game created', undefined, 'Remote Plasma Trace'])).to.eq('Game created · Remote Plasma Trace | TM');
  });
});
