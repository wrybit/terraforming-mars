import {expect} from 'chai';
import {testGame} from '../TestGame';
import {remainingProductionPhases} from '../../src/server/ai/gameProgress';
import {setOxygenLevel, setTemperature} from '../TestingUtils';

describe('AI game progress', () => {
  it('a slow game is not over just because generation 12 has passed', () => {
    const [game] = testGame(2);
    game.generation = 13;
    // About half of the steps done (a human kept terraforming slow on purpose)
    setTemperature(game, -4);
    setOxygenLevel(game, 6);
    expect(remainingProductionPhases(game)).greaterThanOrEqual(2);
  });
});
