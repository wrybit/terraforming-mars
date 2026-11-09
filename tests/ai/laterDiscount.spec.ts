import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {clearLaterValueCacheForTest, estimateCardTimings} from '../../src/server/ai/cardValue';
import {Greenhouses} from '../../src/server/cards/base/Greenhouses';

// Holding a card counts only a share of its later value: a lower share plays cards sooner.
describe('AI later discount', () => {
  const random = Math.random;
  // The later value plays random cards as a future tableau: the same sample for both values, or the spread hides the share
  beforeEach(() => {
    clearLaterValueCacheForTest();
    Math.random = () => 0.5;
  });
  afterEach(() => {
    Math.random = random;
    clearPlayerTunings();
  });

  function laterValue(variant: string | undefined): number {
    const [game, player, opponent] = testGame(2);
    game.generation = 5;
    game.addCity(player, game.board.getAvailableSpacesForCity(player)[0]);
    game.addCity(opponent, game.board.getAvailableSpacesForCity(opponent)[0]);
    if (variant !== undefined) {
      setPlayerTuning(player.id, variant);
    }
    return estimateCardTimings(player, [new Greenhouses()]).get(new Greenhouses().name)!.later;
  }

  it('counts more of the later value with a higher share', () => {
    const plain = laterValue(undefined);
    expect(plain).to.be.greaterThan(0);
    // Baseline 0.55 since round 190: the old share 0.85 counts more of the later value
    expect(laterValue('laterDiscount085')).to.be.greaterThan(plain);
  });
});
