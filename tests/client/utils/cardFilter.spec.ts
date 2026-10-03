import {expect} from 'chai';
import {CardName} from '@/common/cards/CardName';
import {CardType} from '@/common/cards/CardType';
import {Tag} from '@/common/cards/Tag';
import {CardResource} from '@/common/CardResource';
import {CardModel} from '@/common/models/CardModel';
import {activeFilterCount, cardFilterOptions, emptyCardFilter, matchesCardFilter, resetCardFilter} from '@/client/utils/cardFilter';

// Ants: active, microbe tag, 9 M€, VP per microbe, collects microbes
// Birds: active, animal tag, 10 M€, VP per animal, collects animals
// Cartel: automated, earth tag, 8 M€, no VP
// Comet: event, space tag, 21 M€
function card(name: CardName): CardModel {
  return {name} as CardModel;
}
const ANTS = card(CardName.ANTS);
const BIRDS = card(CardName.BIRDS);
const CARTEL = card(CardName.CARTEL);
const COMET = card(CardName.COMET);
const CARDS = [ANTS, BIRDS, CARTEL, COMET];
const WITH_COST = {withCost: true};

function names(cards: ReadonlyArray<CardModel>): Array<CardName> {
  return cards.map((card) => card.name);
}

describe('cardFilter', () => {
  it('an empty filter matches every card', () => {
    const filter = emptyCardFilter();
    expect(names(CARDS.filter((c) => matchesCardFilter(c, filter, WITH_COST)))).to.deep.eq(names(CARDS));
  });

  it('options within a group are OR', () => {
    const filter = emptyCardFilter();
    filter.tags.add(Tag.MICROBE);
    filter.tags.add(Tag.EARTH);
    expect(names(CARDS.filter((c) => matchesCardFilter(c, filter, WITH_COST)))).to.deep.eq([CardName.ANTS, CardName.CARTEL]);
  });

  it('groups are AND', () => {
    const filter = emptyCardFilter();
    filter.types.add(CardType.ACTIVE);
    filter.maxCost = 9;
    expect(names(CARDS.filter((c) => matchesCardFilter(c, filter, WITH_COST)))).to.deep.eq([CardName.ANTS]);
  });

  it('filters victory points and collected resources', () => {
    const filter = emptyCardFilter();
    filter.victoryPoints = true;
    expect(names(CARDS.filter((c) => matchesCardFilter(c, filter, WITH_COST)))).to.deep.eq([CardName.ANTS, CardName.BIRDS]);
    filter.resources.add(CardResource.ANIMAL);
    expect(names(CARDS.filter((c) => matchesCardFilter(c, filter, WITH_COST)))).to.deep.eq([CardName.BIRDS]);
  });

  it('ignores cost and playable filters where the list does not offer them', () => {
    const filter = emptyCardFilter();
    filter.maxCost = 5;
    filter.playableOnly = true;
    expect(matchesCardFilter(COMET, filter, {withCost: false})).is.true;
    expect(activeFilterCount(filter, {withCost: false})).eq(0);
    expect(matchesCardFilter(COMET, filter, {withCost: true, playable: new Set([CardName.COMET])})).is.false;
    filter.maxCost = undefined;
    expect(matchesCardFilter(COMET, filter, {withCost: true, playable: new Set([CardName.COMET])})).is.true;
    expect(matchesCardFilter(ANTS, filter, {withCost: true, playable: new Set([CardName.COMET])})).is.false;
  });

  it('offers only what occurs, with counts', () => {
    const options = cardFilterOptions(CARDS, {withCost: true, playable: new Set([CardName.ANTS])});
    expect(options.types.map((o) => [o.value, o.count])).to.deep.eq([[CardType.ACTIVE, 2], [CardType.AUTOMATED, 1], [CardType.EVENT, 1]]);
    // No event tag: the card type covers it
    expect(options.tags.map((o) => o.value)).to.deep.eq([Tag.SPACE, Tag.EARTH, Tag.MICROBE, Tag.ANIMAL]);
    expect(options.victoryPoints).eq(2);
    expect(options.playable).eq(1);
    expect(options.highestCost).eq(21);
  });

  it('offers no type group for a single type and no cost for played cards', () => {
    const options = cardFilterOptions([ANTS, BIRDS], {withCost: false});
    expect(options.types).to.deep.eq([]);
    expect(options.highestCost).is.undefined;
    expect(options.playable).is.undefined;
  });

  it('counts and resets active options', () => {
    const filter = emptyCardFilter();
    filter.tags.add(Tag.SPACE);
    filter.types.add(CardType.EVENT);
    filter.victoryPoints = true;
    filter.maxCost = 10;
    expect(activeFilterCount(filter, WITH_COST)).eq(4);
    resetCardFilter(filter);
    expect(activeFilterCount(filter, WITH_COST)).eq(0);
  });
});
