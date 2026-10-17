import {expect} from 'chai';
import {BASELINE_TUNING, TUNING_VARIANTS} from '../../src/server/ai/aiTuning';
import {STRATEGY_STYLES} from '../../src/server/ai/strategyStyles';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {relativeValue, valuationContext} from '../../src/server/ai/stateValue';
import {testGame} from '../TestGame';

describe('AI strategy styles', () => {
  it('are selectable as tuning variants and only set known weights', () => {
    for (const [name, style] of Object.entries(STRATEGY_STYLES)) {
      expect(TUNING_VARIANTS[name]).to.equal(style);
      for (const key of Object.keys(style).filter((key) => key !== 'styleFocus')) {
        expect(BASELINE_TUNING, `${name}.${key}`).to.have.property(key);
      }
      expect(style.styleFocus, name).to.not.be.undefined;
    }
  });

  // Round 100: weights alone barely changed the play; the focus must pull clearly (several VP per unit).
  it('pulls the city builder clearly towards cities', () => {
    const gain = (tuning: string) => {
      const [game, player] = testGame(2);
      setPlayerTuning(player.id, tuning);
      const context = valuationContext(game, player);
      const before = relativeValue(player, context);
      game.addCity(player, game.board.getAvailableSpacesForCity(player)[0]);
      return (relativeValue(player, context) - before) / context.victoryPoint;
    };
    expect(gain('styleCities')).to.be.greaterThan(gain('baseline') + 2);
    clearPlayerTunings();
  });
});
