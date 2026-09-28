import {expect} from 'chai';
import {tabHighlighted} from '@/client/components/orOptionsShortLabels';

describe('orOptionsShortLabels', () => {
  it('highlights milestone, greenery and temperature tabs', () => {
    expect(tabHighlighted('Claim a milestone')).is.true;
    expect(tabHighlighted({message: 'Convert ${0} plants into greenery', data: []})).is.true;
    expect(tabHighlighted('Convert 8 heat into temperature')).is.true;
    expect(tabHighlighted('Convert 6 heat into temperature')).is.true;
  });

  it('does not highlight other tabs', () => {
    expect(tabHighlighted('Standard projects')).is.false;
    expect(tabHighlighted('Play project card')).is.false;
  });
});
