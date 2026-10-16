import {expect} from 'chai';
import {testGame} from '../TestGame';
import {setOxygenLevel} from '../TestingUtils';
import {valuationContext} from '../../src/server/ai/stateValue';
import {playerView} from '../../src/server/ai/gameCopy';
import {hasTriggerEffect, triggerGain, triggerOrderAdjustments} from '../../src/server/ai/triggerOrder';
import {CardName} from '../../src/common/cards/CardName';
import {Decomposers} from '../../src/server/cards/base/Decomposers';
import {Lichen} from '../../src/server/cards/base/Lichen';
import {ResearchOutpost} from '../../src/server/cards/base/ResearchOutpost';
import {PowerPlant} from '../../src/server/cards/base/PowerPlant';
import {ArcticAlgae} from '../../src/server/cards/base/ArcticAlgae';

describe('AI trigger order', () => {
  it('knows effect cards that react to other cards', () => {
    expect(hasTriggerEffect(new Decomposers())).is.true;
    expect(hasTriggerEffect(new ResearchOutpost())).is.true;
    expect(hasTriggerEffect(new ArcticAlgae())).is.true;
    expect(hasTriggerEffect(new Lichen())).is.false;
  });

  it('measures what a hand card gains from an effect card played first', () => {
    const [game, player] = testGame(2);
    setOxygenLevel(game, 5);
    player.cardsInHand.push(new Decomposers(), new Lichen(), new PowerPlant(), new ResearchOutpost());
    const snapshot = playerView(player);
    const context = valuationContext(game, player);
    // Lichen has a plant tag: one microbe on Decomposers.
    expect(triggerGain(snapshot, player, context, CardName.DECOMPOSERS, CardName.LICHEN)).greaterThan(0);
    // Power Plant has no plant, microbe or animal tag.
    expect(triggerGain(snapshot, player, context, CardName.DECOMPOSERS, CardName.POWER_PLANT)).to.be.closeTo(0, 1e-9);
    // Research Outpost: every card costs 1 M€ less.
    expect(triggerGain(snapshot, player, context, CardName.RESEARCH_OUTPOST, CardName.POWER_PLANT)).greaterThan(0.5);
  });

  it('puts the effect card before the cards it triggers', () => {
    const [game, player] = testGame(2);
    setOxygenLevel(game, 5);
    player.cardsInHand.push(new Decomposers(), new Lichen());
    const playable = new Set([CardName.DECOMPOSERS, CardName.LICHEN]);
    const adjustments = triggerOrderAdjustments(playerView(player), player, valuationContext(game, player), playable, 1, 0.5);
    expect(adjustments.get(CardName.LICHEN)).lessThan(0);
    expect(adjustments.get(CardName.DECOMPOSERS)).greaterThan(0);
  });
});
