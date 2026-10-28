import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {spaceValue} from '../../src/server/ai/spaceValue';
import {nestFillBonus} from '../../src/server/ai/nestFill';
import {drawEngineTimingBonus} from '../../src/server/ai/drawEngineValue';
import {cheapFirstPenalty} from '../../src/server/ai/cheapFirst';
import {AICentral} from '../../src/server/cards/base/AICentral';
import {Tardigrades} from '../../src/server/cards/base/Tardigrades';
import {SpaceType} from '../../src/common/boards/SpaceType';

// Round 152: fill own greenery nests with an own city; play draw engines early.
describe('AI round 152 variants', () => {
  afterEach(() => clearPlayerTunings());

  describe('nestFill', () => {
    it('raises an own city on a spot between two own greeneries', () => {
      const [game, player] = testGame(2);
      const board = game.board;
      const free = (space: {spaceType: SpaceType, tile?: unknown}) => space.spaceType === SpaceType.LAND && space.tile === undefined;
      // A free spot in the middle with two free, non-adjacent land neighbours for the greeneries.
      const spot = board.spaces.find((space) => free(space) &&
        board.getAdjacentSpaces(space).filter(free).length >= 4)!;
      const [first, ...rest] = board.getAdjacentSpaces(spot).filter(free);
      const second = rest.find((space) => !board.getAdjacentSpaces(first).includes(space))!;
      game.addGreenery(player, first);
      game.addGreenery(player, second);
      expect(nestFillBonus(spot, player)).eq(0);
      const plain = spaceValue(spot, 'city', player);
      setPlayerTuning(player.id, 'nestFill');
      expect(nestFillBonus(spot, player)).eq(2);
      expect(spaceValue(spot, 'city', player)).to.be.greaterThan(plain);
    });
  });

  describe('drawEngineValue', () => {
    it('lets a draw engine go before cheaper cards and leaves other cards alone', () => {
      const [, player] = testGame(2);
      const engine = new AICentral();
      const cheap = new Tardigrades();
      player.cardsInHand.push(engine, cheap);
      const playable = new Set([engine.name, cheap.name]);
      expect(drawEngineTimingBonus(player, engine.name, playable)).eq(0);
      setPlayerTuning(player.id, 'drawEngineValue');
      const penalty = cheapFirstPenalty(player, engine.name, playable);
      expect(penalty).to.be.greaterThan(0);
      expect(drawEngineTimingBonus(player, engine.name, playable)).to.be.greaterThan(penalty);
      expect(drawEngineTimingBonus(player, cheap.name, playable)).eq(0);
    });
  });
});
