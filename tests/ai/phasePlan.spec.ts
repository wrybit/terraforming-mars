import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {relativeValue, valuationContext} from '../../src/server/ai/stateValue';
import {Resource} from '../../src/common/Resource';

// Games vs a strong human (2026-10-16, 129 : 197 and 120 : 186): the AI terraformed fast with M€ production 1–5
// until generation 5–10, the human built income and cards first. incomeWeight values production higher early.
describe('AI income weight', () => {
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
    expect(gain(3, 'engine20')).to.be.greaterThan(gain(3, 'baseline') * 1.3);
  });

  it('values it as before late in the game', () => {
    expect(gain(11, 'engine20')).to.be.closeTo(gain(11, 'baseline'), 1e-6);
  });
});
