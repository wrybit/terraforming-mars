import {expect} from 'chai';
import {hasAsteriskRule} from '@/client/cards/hasAsteriskRule';
import {getCardOrThrow} from '@/client/cards/ClientCardManifest';
import {CardName} from '@/common/cards/CardName';

describe('hasAsteriskRule', () => {
  it('finds the "*" in the icon row', () => {
    expect(hasAsteriskRule(getCardOrThrow(CardName.NATURAL_PRESERVE))).is.true;
    expect(hasAsteriskRule(getCardOrThrow(CardName.MARTIAN_RAILS))).is.true;
  });

  it('is false for cards without a special rule', () => {
    expect(hasAsteriskRule(getCardOrThrow(CardName.ALGAE))).is.false;
  });
});
