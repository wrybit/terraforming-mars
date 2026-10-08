import {expect} from 'chai';
import {testGame} from '../TestGame';
import {addGreenery} from '../TestingUtils';
import {milestoneRacePoints} from '../../src/server/ai/milestoneRace';
import {relativeValue, valuationContext} from '../../src/server/ai/stateValue';

describe('AI milestone race', () => {
  it('claiming the last free milestone is worth more than keeping all races open', () => {
    const [game, player, opponent] = testGame(2);
    const named = (name: string) => game.milestones.find((milestone) => milestone.name === name);
    const gardener = named('Gardener');
    const others = game.milestones.filter((milestone) => milestone !== gardener).slice(0, 2);
    expect(gardener).is.not.undefined;
    for (const milestone of others) {
      game.claimedMilestones.push({milestone, player: opponent});
    }
    addGreenery(player);
    addGreenery(player);
    addGreenery(player);
    // One slot left: only the best race counts (at most 2.5 VP for a ready milestone).
    expect(milestoneRacePoints(player)).lessThanOrEqual(2.5);

    const context = valuationContext(game);
    const before = relativeValue(player, context);
    game.claimedMilestones.push({milestone: gardener!, player});
    const after = relativeValue(player, context);
    // In the test game a VP is worth more than 2 M€, so the claim (8 M€) must gain over 8.
    expect(after - before).greaterThan(8);
  });
});
