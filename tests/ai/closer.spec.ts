import {expect} from 'chai';
import {testGame} from '../TestGame';
import {relativeValue, valuationContext} from '../../src/server/ai/stateValue';
import {setPlayerTuning, clearPlayerTunings} from '../../src/server/ai/aiTuning';
import {setTemperature} from '../TestingUtils';
import {Resource} from '../../src/common/Resource';

describe('AI closer', () => {
  afterEach(() => clearPlayerTunings());

  function gainOfRaising(ownProduction: number, rivalProduction: number): number {
    const [game, player, rival] = testGame(2);
    game.generation = 6;
    player.production.add(Resource.MEGACREDITS, ownProduction);
    rival.production.add(Resource.MEGACREDITS, rivalProduction);
    setPlayerTuning(player.id, 'closer');
    const context = valuationContext(game);
    const before = relativeValue(player, context);
    // Four temperature steps raised (TR stays the same, so only the tempo counts)
    setTemperature(game, game.getTemperature() + 8);
    return relativeValue(player, context) - before;
  }

  it('ends the game when the rival has the stronger engine', () => {
    expect(gainOfRaising(5, 25)).greaterThan(0);
  });

  it('drags the game out when its own engine is stronger', () => {
    expect(gainOfRaising(25, 5)).lessThan(0);
  });
});
