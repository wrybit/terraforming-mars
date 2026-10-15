import {expect} from 'chai';
import {testGame} from '../TestGame';
import {Ironworks} from '../../src/server/cards/base/Ironworks';
import {NoctisCity} from '../../src/server/cards/base/NoctisCity';
import {energyUse} from '../../src/server/ai/energyPlan';

describe('AI energy plan', () => {
  it('counts energy nobody uses as surplus', () => {
    const [, player] = testGame(2);
    player.production.override({energy: 2});
    expect(energyUse(player)).deep.eq({used: 0, surplus: 2});
  });

  it('counts energy an action in play needs as used', () => {
    const [, player] = testGame(2);
    player.production.override({energy: 2});
    player.playedCards.push(new Ironworks());
    expect(energyUse(player).used).eq(2);
  });

  it('counts half the energy production a city in hand would take', () => {
    const [, player] = testGame(2);
    player.production.override({energy: 1});
    player.cardsInHand.push(new NoctisCity());
    expect(energyUse(player)).deep.eq({used: 0.5, surplus: 0.5});
  });
});
