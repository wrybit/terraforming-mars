import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {clearLaterValueCacheForTest, estimateCardTimings} from '../../src/server/ai/cardValue';
import {Greenhouses} from '../../src/server/cards/base/Greenhouses';

// Holding a card counts only a share of its later value: a lower share plays cards sooner.
describe('AI later discount', () => {
  beforeEach(() => clearLaterValueCacheForTest());
  afterEach(() => clearPlayerTunings());

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

  it('counts less of the later value with a lower share', () => {
    const plain = laterValue(undefined);
    expect(plain).to.be.greaterThan(0);
    expect(laterValue('laterDiscount055')).to.be.lessThan(plain);
  });
});
