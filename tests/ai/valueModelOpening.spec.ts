import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {relativeValue, valuationContext} from '../../src/server/ai/stateValue';

// Rated human game (2026-10-16): the AI kept M€ production at 0 or below until generation 8; the learned model
// prices income in the opening far below the hand-made valuation.
describe('AI opening share of the learned position value', () => {
  afterEach(() => clearPlayerTunings());

  function position(generation: number) {
    const [game, player, opponent] = testGame(2);
    game.generation = generation;
    player.production.override({megacredits: 6});
    opponent.setTerraformRating(22);
    return player;
  }

  function value(generation: number, tuning: string) {
    const player = position(generation);
    setPlayerTuning(player.id, tuning);
    return relativeValue(player, valuationContext(player.game, player));
  }

  it('uses the hand-made valuation alone in the opening with openingModel0', () => {
    expect(value(2, 'openingModel0')).to.be.closeTo(value(2, 'noValueModel'), 1e-9);
  });

  it('keeps the model share after the opening', () => {
    expect(value(6, 'openingModel0')).to.be.closeTo(value(6, 'baseline'), 1e-9);
    expect(value(6, 'openingModel0')).to.not.be.closeTo(value(6, 'noValueModel'), 1e-6);
  });
});
