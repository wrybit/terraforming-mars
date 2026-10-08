import {expect} from 'chai';
import {testGame} from '../TestGame';
import {remainingProductionPhases} from '../../src/server/ai/gameProgress';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
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

  it('expects longer two-player games with the realLength variant', () => {
    const [game, player] = testGame(2);
    game.generation = 8;
    setTemperature(game, -10);
    setOxygenLevel(game, 7);
    const fixed = remainingProductionPhases(game, player);
    setPlayerTuning(player.id, 'realLength');
    const byPlayers = remainingProductionPhases(game, player);
    clearPlayerTunings();
    expect(byPlayers).greaterThan(fixed);
  });
});
