import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {nextCardDiscountValue} from '../../src/server/ai/nextCardDiscount';
import {IndenturedWorkers} from '../../src/server/cards/base/IndenturedWorkers';
import {Research} from '../../src/server/cards/base/Research';
import {Tardigrades} from '../../src/server/cards/base/Tardigrades';

// Events that make the next card cheaper count that discount, capped by the next card's cost.
describe('AI next card discount', () => {
  afterEach(() => clearPlayerTunings());

  it('is off in the baseline', () => {
    const [, player] = testGame(2);
    expect(nextCardDiscountValue(player, new IndenturedWorkers())).to.eq(0);
  });

  it('counts the discount on the next hand card, at most its cost', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'nextCardDiscount08');
    const workers = new IndenturedWorkers();
    player.cardsInHand.push(workers, new Research());
    expect(nextCardDiscountValue(player, workers)).to.be.closeTo(0.8 * 8, 0.01);
    player.cardsInHand.splice(1, 1, new Tardigrades());
    expect(nextCardDiscountValue(player, workers)).to.be.closeTo(0.8 * 4, 0.01);
  });

  it('ignores cards without a next-card discount', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'nextCardDiscount08');
    expect(nextCardDiscountValue(player, new Research())).to.eq(0);
  });
});
