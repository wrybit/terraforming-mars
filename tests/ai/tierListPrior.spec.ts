import {expect} from 'chai';
import {CardName} from '../../src/common/cards/CardName';
import {cardPriorFactor} from '../../src/server/ai/cardPriors';
import {tierListScore} from '../../src/server/ai/tierListPrior';
import tierList from '../../src/server/ai/data/tierListConsensus.json';

describe('AI tier list prior', () => {
  it('knows every card of the consensus file by its card name', () => {
    const names = new Set<string>(Object.values(CardName));
    const unknown = Object.keys(tierList.cards).filter((name) => !names.has(name));
    expect(unknown).to.deep.equal([]);
  });

  it('ranks card-drawing engines above energy converters', () => {
    expect(tierListScore(CardName.BUSINESS_CONTACTS)).to.be.greaterThan(1);
    expect(tierListScore(CardName.IRONWORKS)).to.be.lessThan(-1);
  });

  it('changes card values only with a weight', () => {
    expect(cardPriorFactor(CardName.BUSINESS_CONTACTS, 0, 0, 1, 0)).to.equal(1);
    expect(cardPriorFactor(CardName.BUSINESS_CONTACTS, 0, 0, 1, 2)).to.be.greaterThan(1.2);
  });
});
