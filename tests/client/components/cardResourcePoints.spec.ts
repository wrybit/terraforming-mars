import {expect} from 'chai';
import {cardResourcePoints} from '@/client/components/cardResourcePoints';
import {CardName} from '@/common/cards/CardName';

describe('cardResourcePoints', () => {
  it('scores one point per resource', () => {
    expect(cardResourcePoints(CardName.FISH, {before: 2, after: 3})).deep.eq({before: 2, after: 3, per: 1, progress: 0});
  });

  it('scores whole steps of several resources and shows the progress', () => {
    expect(cardResourcePoints(CardName.TARDIGRADES, {before: 3, after: 4})).deep.eq({before: 0, after: 1, per: 4, progress: 0});
    expect(cardResourcePoints(CardName.TARDIGRADES, {before: 1, after: 2})).deep.eq({before: 0, after: 0, per: 4, progress: 2});
  });

  it('is undefined for cards without points per resource', () => {
    expect(cardResourcePoints(CardName.NITRITE_REDUCING_BACTERIA, {before: 1, after: 2})).is.undefined;
    expect(cardResourcePoints(undefined, {before: 1, after: 2})).is.undefined;
  });
});
