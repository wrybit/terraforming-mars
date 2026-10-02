import {expect} from 'chai';
import {gameDocumentTitle, turnTitlePrefix} from '@/client/utils/documentTitle';

describe('documentTitle', () => {
  it('shows generation only when not on turn', () => {
    expect(gameDocumentTitle({generation: 5})).to.eq('Gen 5 | TM');
  });

  it('shows turn marker first when on turn', () => {
    expect(gameDocumentTitle({generation: 5}, turnTitlePrefix())).to.eq('● Your turn · Gen 5 | TM');
  });

  it('accepts animated marker', () => {
    expect(gameDocumentTitle({generation: 3}, turnTitlePrefix('◑'))).to.eq('◑ Your turn · Gen 3 | TM');
  });
});
