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

  it('expects longer two-player than three-player games', () => {
    const remainingAt = (players: number) => {
      const [game, player] = testGame(players);
      game.generation = 8;
      setTemperature(game, -10);
      setOxygenLevel(game, 7);
      return remainingProductionPhases(game, player);
    };
    // Measured: 2 players 14.5 generations, 3 players 11.8; with a fixed 12 both said 4 at generation 8.
    expect(remainingAt(2)).greaterThan(remainingAt(3));
  });
});
