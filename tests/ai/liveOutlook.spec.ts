import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {handOutlookMap, outlookChange} from '../../src/server/ai/liveOutlook';
import {AICentral} from '../../src/server/cards/base/AICentral';
import {Research} from '../../src/server/cards/base/Research';
import {CardName} from '../../src/common/cards/CardName';

// A move that brings a hand card's requirement closer raises the card's value in the move search.
describe('AI live requirement outlook', () => {
  afterEach(() => clearPlayerTunings());

  it('is off in the baseline', () => {
    const [, player] = testGame(2);
    player.cardsInHand.push(new AICentral());
    expect(handOutlookMap(player)).to.be.undefined;
  });

  it('raises the value of AI Central when science tags come in', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'liveOutlook1');
    player.cardsInHand.push(new AICentral());
    const reference = handOutlookMap(player);
    expect(reference?.get(CardName.AI_CENTRAL)).to.be.lessThan(1);
    expect(outlookChange(player, CardName.AI_CENTRAL, reference)).to.eq(1);
    player.playedCards.push(new Research());
    expect(outlookChange(player, CardName.AI_CENTRAL, reference)).to.be.greaterThan(1.3);
  });
});
