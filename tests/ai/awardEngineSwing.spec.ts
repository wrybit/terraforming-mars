import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {awardEngineSwing} from '../../src/server/ai/awardEngineSwing';
import {Resource} from '../../src/common/Resource';

// A narrow award lead against a faster-growing engine is less safe.
describe('AI award engine swing', () => {
  afterEach(() => clearPlayerTunings());
  const noDraws = () => 0;

  it('is off in the baseline', () => {
    const [, player, opponent] = testGame(2);
    opponent.production.add(Resource.MEGACREDITS, 10);
    expect(awardEngineSwing(player, 5, noDraws)).eq(0);
  });

  it('grows with the opponent engine advantage and the remaining generations', () => {
    const [, player, opponent] = testGame(2);
    setPlayerTuning(player.id, 'awardEngine');
    expect(awardEngineSwing(player, 5, noDraws)).eq(0);
    opponent.production.add(Resource.MEGACREDITS, 10);
    expect(awardEngineSwing(player, 5, noDraws)).to.be.closeTo(5, 0.01);
    expect(awardEngineSwing(player, 2, noDraws)).to.be.closeTo(2, 0.01);
  });
});
