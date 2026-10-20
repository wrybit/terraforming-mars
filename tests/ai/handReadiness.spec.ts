import {expect} from 'chai';
import {testGame} from '../TestGame';
import {handReadiness} from '../../src/server/ai/handReadiness';
import {enablerBonus} from '../../src/server/ai/enablerValue';
import {AICentral} from '../../src/server/cards/base/AICentral';
import {DevelopmentCenter} from '../../src/server/cards/base/DevelopmentCenter';
import {Research} from '../../src/server/cards/base/Research';
import {PhysicsComplex} from '../../src/server/cards/base/PhysicsComplex';
import {PowerPlant} from '../../src/server/cards/base/PowerPlant';
import {Resource} from '../../src/common/Resource';
import {CardName} from '../../src/common/cards/CardName';

// Unfulfilled hand synergies: how far the position meets what a hand card needs (tags, energy).
describe('AI hand readiness', () => {
  it('counts science tags towards a tag requirement', () => {
    const [, player] = testGame(2);
    const card = new AICentral();
    expect(handReadiness(player, card, 8)).to.eq(0);
    player.playedCards.push(new Research());
    player.production.add(Resource.ENERGY, 1);
    expect(handReadiness(player, card, 8)).to.be.closeTo(2 / 3, 1e-9);
    player.playedCards.push(new PhysicsComplex());
    expect(handReadiness(player, card, 8)).to.eq(1);
  });

  it('needs energy production for an action that spends energy', () => {
    const [, player] = testGame(2);
    const card = new DevelopmentCenter();
    expect(handReadiness(player, card, 8)).to.be.lessThan(0.2);
    player.production.add(Resource.ENERGY, 1);
    expect(handReadiness(player, card, 8)).to.eq(1);
  });

  it('values an energy card as enabler for a hand card that spends energy', () => {
    const [, player] = testGame(2);
    player.cardsInHand.push(new DevelopmentCenter());
    const bonus = enablerBonus(new PowerPlant(), player, new Map([[CardName.DEVELOPMENT_CENTER, 10]]));
    expect(bonus).to.eq(10);
  });
});
