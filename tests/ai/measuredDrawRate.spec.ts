import {expect} from 'chai';
import {measuredDrawRate} from '../../src/server/ai/measuredDrawRate';
import {CardName} from '../../src/common/cards/CardName';

// Draw engines the card reading misses get the draws per generation measured in human games.
describe('AI measured draw rate', () => {
  it('knows draw engines that draw through resources or energy', () => {
    expect(measuredDrawRate(CardName.AERIAL_MAPPERS)).to.be.greaterThan(0.5);
    expect(measuredDrawRate(CardName.HI_TECH_LAB)).to.be.greaterThan(0.5);
    expect(measuredDrawRate(CardName.OLYMPUS_CONFERENCE)).to.be.greaterThan(0.5);
  });

  it('is 0 for cards that do not draw', () => {
    expect(measuredDrawRate(CardName.POWER_PLANT)).to.eq(0);
  });
});
