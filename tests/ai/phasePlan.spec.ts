import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {relativeValue, valuationContext} from '../../src/server/ai/stateValue';
import {Resource} from '../../src/common/Resource';
import {gamePhase, openingBrakeCost} from '../../src/server/ai/phasePlan';

// Games vs a strong human (2026-10-16, 129 : 197 and 120 : 186): the AI terraformed fast with M€ production 1–5
// until generation 5–10, the human built income and cards first. phasePlan values production higher in the first third.
describe('AI three-phase plan (income first)', () => {
  afterEach(() => clearPlayerTunings());

  function gain(generation: number, tuning: string): number {
    const [game, player] = testGame(2);
    game.generation = generation;
    setPlayerTuning(player.id, tuning);
    const context = valuationContext(game, player);
    const before = relativeValue(player, context);
    player.production.add(Resource.MEGACREDITS, 3);
    return relativeValue(player, context) - before;
  }

  it('values M€ production higher in the opening', () => {
    expect(gain(3, 'phase1')).to.be.greaterThan(gain(3, 'baseline') * 1.3);
  });

  it('values it as before late in the game', () => {
    expect(gain(13, 'phase1')).to.be.closeTo(gain(13, 'baseline'), 1e-6);
  });

  it('splits the game into thirds', () => {
    expect(gamePhase(2, 12)).to.equal(1);
    expect(gamePhase(7, 7)).to.equal(2);
    expect(gamePhase(12, 2)).to.equal(3);
  });

  // With a greenery already down (prelude), Gardener is a goal: up to 3 greeneries are not braked, more are.
  it('does not brake the first three greeneries', () => {
    const [game, player] = testGame(2);
    game.generation = 2;
    setPlayerTuning(player.id, 'phase1');
    const greenery = () => game.addGreenery(player, game.board.getAvailableSpacesForGreenery(player)[0]);
    greenery();
    greenery();
    const frozen = valuationContext(game, player);
    greenery();
    expect(openingBrakeCost(player, frozen, 1)).to.equal(0);
    greenery();
    expect(openingBrakeCost(player, frozen, 2)).to.be.greaterThan(0);
  });

  it('brakes greeneries without one already on the board', () => {
    const [game, player] = testGame(2);
    game.generation = 2;
    setPlayerTuning(player.id, 'phase1');
    const frozen = valuationContext(game, player);
    game.addGreenery(player, game.board.getAvailableSpacesForGreenery(player)[0]);
    expect(openingBrakeCost(player, frozen, 1)).to.be.greaterThan(0);
  });
});
