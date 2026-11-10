import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {expectedGenerations, remainingProductionPhases} from '../../src/server/ai/gameProgress';

// Round 191: a 13-generation horizon lost (fewer cards bought); round 192: 16 played more cards and was adopted.
describe('AI two-player game length', () => {
  afterEach(() => clearPlayerTunings());

  it('expects 16 generations by default', () => {
    const [game, player] = testGame(2);
    expect(expectedGenerations(game, player)).eq(16);
  });

  it('shifts the remaining production phases with the variants', () => {
    const [game, player] = testGame(2);
    game.generation = 3;
    const plain = remainingProductionPhases(game, player);
    setPlayerTuning(player.id, 'twoPlayerLength13');
    expect(remainingProductionPhases(game, player)).eq(plain - 3);
    setPlayerTuning(player.id, 'twoPlayerLength15');
    expect(expectedGenerations(game, player)).eq(15);
    expect(remainingProductionPhases(game, player)).eq(plain - 1);
    setPlayerTuning(player.id, 'twoPlayerLength17');
    expect(remainingProductionPhases(game, player)).eq(plain + 1);
  });
});
