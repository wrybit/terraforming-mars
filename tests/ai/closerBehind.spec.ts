import {expect} from 'chai';
import {testGame} from '../TestGame';
import {relativeValue, valuationContext} from '../../src/server/ai/stateValue';
import {setPlayerTuning, clearPlayerTunings} from '../../src/server/ai/aiTuning';
import {closerBehindFactor} from '../../src/server/ai/closerBehind';
import {setTemperature} from '../TestingUtils';
import {Resource} from '../../src/common/Resource';

// A trailing player loses more with every extra generation of a stronger rival engine: closerBehind scales the
// closer term up only while behind; the leader is left unchanged.
describe('AI closerBehind', () => {
  afterEach(() => clearPlayerTunings());

  it('changes nothing in the baseline or while ahead', () => {
    const [, player] = testGame(2);
    expect(closerBehindFactor(player, 10, 20)).eq(1);
    setPlayerTuning(player.id, 'closerBehind');
    expect(closerBehindFactor(player, 30, 20)).eq(1);
    expect(closerBehindFactor(player, 10, 20)).eq(2);
  });

  function gainOfRaising(variant?: string): number {
    // Test players share ids between games: start from the baseline every time.
    clearPlayerTunings();
    const [game, player, rival] = testGame(2);
    game.generation = 6;
    player.production.add(Resource.MEGACREDITS, 5);
    rival.production.add(Resource.MEGACREDITS, 25);
    // The rival is also ahead on points.
    rival.increaseTerraformRating(15);
    if (variant !== undefined) {
      setPlayerTuning(player.id, variant);
    }
    const context = valuationContext(game);
    const before = relativeValue(player, context);
    setTemperature(game, game.getTemperature() + 8);
    return relativeValue(player, context) - before;
  }

  it('ends the game harder when trailing a stronger engine', () => {
    // Baseline closer 0.5; while behind the variant doubles the term.
    expect(gainOfRaising('closerBehind')).greaterThan(gainOfRaising());
  });
});
