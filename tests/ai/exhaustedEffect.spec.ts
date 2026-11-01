import {expect} from 'chai';
import {testGame} from '../TestGame';
import {actionExhausted, cardExhausted, effectExhausted} from '../../src/server/ai/exhaustedEffect';
import {playerValue, valuationContext} from '../../src/server/ai/stateValue';
import {ArcticAlgae} from '../../src/server/cards/base/ArcticAlgae';
import {Pets} from '../../src/server/cards/base/Pets';
import {Fish} from '../../src/server/cards/base/Fish';
import {NeptunianPowerConsultants} from '../../src/server/cards/promo/NeptunianPowerConsultants';
import {IcyImpactors} from '../../src/server/cards/promo/IcyImpactors';
import {IProjectCard} from '../../src/server/cards/IProjectCard';
import {maxOutOceans} from '../TestingUtils';

// Effects and actions that only work through a global parameter earn nothing once it is maxed (human games:
// Arctic Algae, Neptunian Power Consultants and Icy Impactors played at 9/9 oceans).
describe('AI exhausted effects', () => {
  it('Arctic Algae earns nothing once all oceans are placed', () => {
    const [game, player] = testGame(2);
    const algae = new ArcticAlgae();
    expect(effectExhausted(algae, game)).is.false;
    maxOutOceans(player);
    expect(effectExhausted(algae, game)).is.true;
  });

  it('effects without a global parameter trigger are never exhausted', () => {
    const [game, player] = testGame(2);
    maxOutOceans(player);
    expect(effectExhausted(new Pets(), game)).is.false;
  });

  it('reads an effect drawn as a plain row (Neptunian Power Consultants)', () => {
    const [game, player] = testGame(2);
    const card = new NeptunianPowerConsultants();
    expect(cardExhausted(card, game)).is.false;
    maxOutOceans(player);
    expect(cardExhausted(card, game)).is.true;
  });

  it('an action that only places oceans, or stocks the card for that, is exhausted at 9/9 oceans', () => {
    const [game, player] = testGame(2);
    const icy = new IcyImpactors();
    expect(actionExhausted(icy, game)).is.false;
    maxOutOceans(player);
    expect(actionExhausted(icy, game)).is.true;
    // Fish scores points for its animals: never exhausted by the oceans.
    expect(actionExhausted(new Fish(), game)).is.false;
  });

  it('an exhausted card adds nothing to the position value at 9/9 oceans', () => {
    // Only the tag stays (power for Neptunian Power Consultants, space for Icy Impactors): a small rest value.
    const gain = (card: IProjectCard) => {
      const [game, player] = testGame(2);
      maxOutOceans(player);
      const empty = playerValue(player, valuationContext(game, player));
      player.playedCards.push(card);
      return playerValue(player, valuationContext(game, player)) - empty;
    };
    expect(gain(new NeptunianPowerConsultants())).to.be.lessThan(2);
    expect(gain(new IcyImpactors())).to.be.lessThan(2);
  });
});
