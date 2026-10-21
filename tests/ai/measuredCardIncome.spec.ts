import {expect} from 'chai';
import {testGame} from '../TestGame';
import {clearPlayerTunings, setPlayerTuning} from '../../src/server/ai/aiTuning';
import {measuredCardIncome} from '../../src/server/ai/measuredCardIncome';
import {EarthCatapult} from '../../src/server/cards/base/EarthCatapult';
import {Ironworks} from '../../src/server/cards/base/Ironworks';
import {Resource} from '../../src/common/Resource';

// Lasting effects and actions count what they were measured to bring per generation.
describe('AI measured card income', () => {
  afterEach(() => clearPlayerTunings());

  it('is off without the rule', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'noCardFix');
    expect(measuredCardIncome(player, new EarthCatapult(), 8)).to.eq(0);
  });

  it('values a discount above the flat effect value', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'cardIncome1');
    expect(measuredCardIncome(player, new EarthCatapult(), 8)).to.be.greaterThan(2);
  });

  it('counts an energy action only as far as energy production feeds it', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'cardActions05');
    expect(measuredCardIncome(player, new Ironworks(), 8)).to.eq(0);
    player.production.add(Resource.ENERGY, 4);
    expect(measuredCardIncome(player, new Ironworks(), 8)).to.be.greaterThan(2);
  });

  it('caps the measured action income at a realistic yield', () => {
    const [, player] = testGame(2);
    setPlayerTuning(player.id, 'cardActionsCap2');
    player.production.add(Resource.ENERGY, 6);
    expect(measuredCardIncome(player, new Ironworks(), 8)).to.be.at.most(2);
  });
});
