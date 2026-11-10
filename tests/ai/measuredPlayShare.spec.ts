import {expect} from 'chai';
import {CardName} from '../../src/common/cards/CardName';
import {measuredPlayShare, withPlayShare} from '../../src/server/ai/measuredPlayShare';

describe('AI measured play share', () => {
  it('knows cards the AI hardly ever plays', () => {
    expect(measuredPlayShare(CardName.STRATOSPHERIC_BIRDS)).lessThan(0.2);
    expect(measuredPlayShare('No such card')).eq(1);
  });

  it('scales the buying value toward the share', () => {
    const valueOf = () => 20;
    const share = measuredPlayShare(CardName.EXTRACTOR_BALLOONS);
    expect(withPlayShare(valueOf, 0)(CardName.EXTRACTOR_BALLOONS)).eq(20);
    expect(withPlayShare(valueOf, 1)(CardName.EXTRACTOR_BALLOONS)).closeTo(20 * share, 1e-9);
    expect(withPlayShare(valueOf, 0.5)(CardName.EXTRACTOR_BALLOONS)).closeTo(20 * (1 + share) / 2, 1e-9);
  });
});
