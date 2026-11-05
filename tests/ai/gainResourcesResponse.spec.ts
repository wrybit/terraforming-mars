import {expect} from 'chai';
import {testGame} from '../TestGame';
import {GainResources} from '../../src/server/inputs/GainResources';
import {quickResponse} from '../../src/server/ai/quickResponse';
import {randomResponse} from '../../src/server/ai/randomResponse';

describe('gainResourcesResponse', () => {
  // Round 180: a batch game got stuck on the Dry Deserts global event (gain 2 resources of choice).
  it('quick answer adds up to the count and is accepted', () => {
    const [, player] = testGame(2);
    const input = new GainResources(player, 2, 'Gain 2 resources');
    input.process(quickResponse(input, player), player);
    expect(player.megaCredits).eq(2);
  });

  it('random answer adds up to the count and is accepted', () => {
    const [, player] = testGame(2);
    const input = new GainResources(player, 3, 'Gain 3 resources');
    expect(() => input.process(randomResponse(input, player, () => 0.6), player)).to.not.throw();
  });
});
