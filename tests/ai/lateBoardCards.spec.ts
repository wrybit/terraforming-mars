import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {clearLaterValueCacheForTest, estimateCardTimings} from '../../src/server/ai/cardValue';
import {Greenhouses} from '../../src/server/cards/base/Greenhouses';
import {SeededRandom} from '../../src/common/utils/Random';

// Rated human game (2026-10-16): Greenhouses not bought in generation 5 (value −1.5 with 1 city on the board).
// Strong players always take it and play it as late as possible, when many cities are in play.
const RANDOM_SEED = 1;

describe('AI values city-counting cards at the end of the game', () => {
  // The later value samples future hands with Math.random: fixed numbers, so the comparison does not depend on luck
  // (failed now and then in CI)
  const originalRandom = Math.random;
  beforeEach(() => {
    clearLaterValueCacheForTest();
    const random = new SeededRandom(RANDOM_SEED);
    Math.random = () => random.next();
  });
  afterEach(() => {
    Math.random = originalRandom;
    clearPlayerTunings();
  });

  function earlyGame() {
    const [game, player, opponent] = testGame(2);
    game.generation = 5;
    game.addCity(player, game.board.getAvailableSpacesForCity(player)[0]);
    game.addCity(opponent, game.board.getAvailableSpacesForCity(opponent)[0]);
    return player;
  }

  it('worth more later than now, and more than without the late board', () => {
    const player = earlyGame();
    const timing = estimateCardTimings(player, [new Greenhouses()]).get(new Greenhouses().name)!;
    expect(timing.later).to.be.greaterThan(timing.now);
    setPlayerTuning(player.id, 'noLateBoardCards');
    const plain = estimateCardTimings(earlyGame(), [new Greenhouses()]).get(new Greenhouses().name)!;
    expect(timing.later).to.be.greaterThan(plain.later);
  });
});
