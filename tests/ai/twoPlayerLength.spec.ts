import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {expectedGenerations, remainingProductionPhases} from '../../src/server/ai/gameProgress';

// Against humans two-player games end sooner than the AI expected (12.2 generations, the prior said 15).
// Round 191: 13 lost (fewer cards bought and played), so longer horizons are tested too.
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

  it('expects longer games with the 16 and 17 variants', () => {
    const [game, player] = testGame(2);
    game.generation = 3;
    const plain = remainingProductionPhases(game, player);
    setPlayerTuning(player.id, 'twoPlayerLength16');
    expect(remainingProductionPhases(game, player)).eq(plain + 1);
    setPlayerTuning(player.id, 'twoPlayerLength17');
    expect(expectedGenerations(game, player)).eq(17);
    expect(remainingProductionPhases(game, player)).eq(plain + 2);
  });
});
