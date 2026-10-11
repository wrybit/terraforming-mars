import {expect} from 'chai';
import {testGame} from '../TestGame';
import {cardsForMilestone} from '../../src/server/ai/milestoneBuying';
import {Tardigrades} from '../../src/server/cards/base/Tardigrades';
import {Sabotage} from '../../src/server/cards/base/Sabotage';
import {PowerPlant} from '../../src/server/cards/base/PowerPlant';

describe('AI buying for a milestone', () => {
  it('buys the 16th card for Planner', () => {
    const [game, player] = testGame(2);
    expect(game.milestones.some((milestone) => milestone.name === 'Planner')).is.true;
    for (let index = 0; index < 15; index++) {
      player.cardsInHand.push(new PowerPlant());
    }
    player.megaCredits = 20;
    const extra = cardsForMilestone(player, [], [new Tardigrades(), new Sabotage()], 3);
    expect(extra.map((card) => card.name)).deep.eq([new Tardigrades().name]);
    // The test cards are gone again.
    expect(player.cardsInHand).has.length(15);
  });

  it('buys nothing when the money for the claim would be missing', () => {
    const [/* game */, player] = testGame(2);
    for (let index = 0; index < 15; index++) {
      player.cardsInHand.push(new PowerPlant());
    }
    player.megaCredits = 10;
    expect(cardsForMilestone(player, [], [new Tardigrades()], 3)).is.empty;
    expect(player.cardsInHand).has.length(15);
  });
});
