import {expect} from 'chai';
import {gameDocumentTitle, turnTitleState} from '@/client/utils/documentTitle';

const game = {name: 'Cosmic Pressure Flow', generation: 5};

describe('documentTitle', () => {
  it('shows state, player, generation and name on own turn', () => {
    expect(gameDocumentTitle({game, thisPlayer: {name: 'Jens'}, waitingFor: {}}))
      .to.eq('● Your turn · Jens · Gen 5 · Cosmic Pressure Flow | TM');
  });

  it('omits state when not on turn or input is optional', () => {
    expect(gameDocumentTitle({game, thisPlayer: {name: 'Jens'}})).to.eq('Jens · Gen 5 · Cosmic Pressure Flow | TM');
    expect(gameDocumentTitle({game, thisPlayer: {name: 'Jens'}, waitingFor: {optional: true}})).to.eq('Jens · Gen 5 · Cosmic Pressure Flow | TM');
  });

  it('omits player for spectators', () => {
    expect(gameDocumentTitle({game})).to.eq('Gen 5 · Cosmic Pressure Flow | TM');
  });

  it('accepts explicit state', () => {
    expect(gameDocumentTitle({game, waitingFor: {}}, turnTitleState('◑'))).to.eq('◑ Your turn · Gen 5 · Cosmic Pressure Flow | TM');
    expect(gameDocumentTitle({game}, '🏁')).to.eq('🏁 · Gen 5 · Cosmic Pressure Flow | TM');
  });
});
