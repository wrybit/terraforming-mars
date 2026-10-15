import {expect} from 'chai';
import {testGame} from '../TestGame';
import {Ironworks} from '../../src/server/cards/base/Ironworks';
import {NoctisCity} from '../../src/server/cards/base/NoctisCity';
import {RoboticWorkforce} from '../../src/server/cards/base/RoboticWorkforce';
import {Mine} from '../../src/server/cards/base/Mine';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {energyUse} from '../../src/server/ai/energyPlan';
import {plannedResponse} from '../../src/server/ai/followUpPlan';

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

describe('AI follow-up card choice', () => {
  it('answers a single-card choice with the planned card', () => {
    const [, player] = testGame(2);
    const cards = [new Mine(), new RoboticWorkforce()];
    const input = new SelectCard('Select builder card to copy', 'Copy', cards);
    expect(plannedResponse(input, 1, player)).deep.eq({type: 'card', cards: [cards[1].name]});
    expect(plannedResponse(input, 5, player)).is.undefined;
  });
});
