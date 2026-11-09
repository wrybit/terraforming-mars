import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {expectedGenerations, remainingProductionPhases} from '../../src/server/ai/gameProgress';

// Against humans two-player games end sooner than the AI expected (12.2 generations, the prior said 15).
describe('AI two-player game length', () => {
  afterEach(() => clearPlayerTunings());

  it('expects 15 generations by default and 13 with the variant', () => {
    const [game, player] = testGame(2);
    expect(expectedGenerations(game, player)).eq(15);
    game.generation = 3;
    const plain = remainingProductionPhases(game, player);
    setPlayerTuning(player.id, 'twoPlayerLength13');
    expect(expectedGenerations(game, player)).eq(13);
    expect(remainingProductionPhases(game, player)).eq(plain - 2);
  });
});
