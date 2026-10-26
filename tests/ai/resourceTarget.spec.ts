import {expect} from 'chai';
import {testGame} from '../TestGame';
import {quickResponse} from '../../src/server/ai/quickResponse';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {ICard} from '../../src/server/cards/ICard';
import {Ants} from '../../src/server/cards/base/Ants';
import {Tardigrades} from '../../src/server/cards/base/Tardigrades';
import {GHGProducingBacteria} from '../../src/server/cards/base/GHGProducingBacteria';
import {VenusianAnimals} from '../../src/server/cards/venusNext/VenusianAnimals';

// Resource targets follow the VP the step brings or costs (human games: Ants ate its own microbe, Mohole Lake put
// the last animal on Tardigrades instead of Venusian Animals).
describe('AI resource targets', () => {
  const choose = (title: string, cards: Array<ICard>, player: Parameters<typeof quickResponse>[1]) => {
    const response = quickResponse(new SelectCard(title, 'Select', cards), player);
    return response.type === 'card' ? response.cards[0] : undefined;
  };

  it('removes a microbe from the opponent, not from its own Ants', () => {
    const [, player, opponent] = testGame(2);
    const ants = new Ants();
    ants.resourceCount = 1;
    const theirs = new Tardigrades();
    theirs.resourceCount = 4;
    player.playedCards.push(ants);
    opponent.playedCards.push(theirs);
    expect(choose('Select card to remove 1 Microbe(s)', [ants, theirs], player)).eq(theirs.name);
  });

  it('without opponent microbes takes from the own card that loses least, not from Ants', () => {
    const [, player] = testGame(2);
    const ants = new Ants();
    ants.resourceCount = 1;
    const tardigrades = new Tardigrades();
    tardigrades.resourceCount = 1;
    player.playedCards.push(ants, tardigrades);
    expect(choose('Select card to remove 1 Microbe(s)', [ants, tardigrades], player)).eq(tardigrades.name);
  });

  it('adds an animal to Venusian Animals (1 VP each), not to Tardigrades with 2 microbes', () => {
    const [, player] = testGame(2);
    const tardigrades = new Tardigrades();
    tardigrades.resourceCount = 2;
    const animals = new VenusianAnimals();
    player.playedCards.push(tardigrades, animals);
    expect(choose('Select card to add 1 resource', [tardigrades, animals], player)).eq(animals.name);
  });

  it('adds to Tardigrades at 3 (the next one scores) rather than to a card without VP', () => {
    const [, player] = testGame(2);
    const tardigrades = new Tardigrades();
    tardigrades.resourceCount = 3;
    const bacteria = new GHGProducingBacteria();
    player.playedCards.push(bacteria, tardigrades);
    expect(choose('Select card to add 1 microbe', [bacteria, tardigrades], player)).eq(tardigrades.name);
  });
});
