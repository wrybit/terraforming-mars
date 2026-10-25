import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {tagDemandValue, tagStockValue} from '../../src/server/ai/tagDemand';
import {Tag} from '../../src/common/cards/Tag';
import {Research} from '../../src/server/cards/base/Research';

// Tags count as a stock for later requirements; building tags more while Builder is open.
describe('AI tag demand', () => {
  afterEach(() => clearPlayerTunings());

  it('is off in the baseline', () => {
    const [, player] = testGame(2);
    expect(tagDemandValue(player, new Research())).to.eq(0);
  });

  it('values science tags because cards in the deck require them', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'tagDemand1');
    expect(tagStockValue(player, Tag.SCIENCE)).to.be.greaterThan(0.5);
    expect(tagDemandValue(player, new Research())).to.be.greaterThan(1);
  });

  it('values building tags more while Builder is open', () => {
    const [game, player] = testGame(2);
    setPlayerTuning(player.id, 'tagDemand1');
    const withBuilder = game.milestones.some((milestone) => milestone.name === 'Builder');
    if (withBuilder) {
      expect(tagStockValue(player, Tag.BUILDING)).to.be.greaterThan(tagStockValue(player, Tag.JOVIAN));
    }
  });
});
