import {expect} from 'chai';
import {BASELINE_TUNING, TUNING_VARIANTS} from '../../src/server/ai/aiTuning';
import {STRATEGY_STYLES} from '../../src/server/ai/strategyStyles';

describe('AI strategy styles', () => {
  it('are selectable as tuning variants and only set known weights', () => {
    for (const [name, style] of Object.entries(STRATEGY_STYLES)) {
      expect(TUNING_VARIANTS[name]).to.equal(style);
      for (const key of Object.keys(style)) {
        expect(BASELINE_TUNING, `${name}.${key}`).to.have.property(key);
      }
    }
  });
});
