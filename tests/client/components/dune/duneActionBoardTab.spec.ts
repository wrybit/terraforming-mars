import {expect} from 'chai';
import {duneBoardTabOf} from '@/client/components/dune/duneActionBoardTab';
import {
  BLACK_MARKET_TITLE, CHOAM_OFFER_TITLE, KANLY_SEND_TITLE, OPEN_KANLY_TITLE, SMUGGLE_SPICE_TITLE, WORM_TITLE,
} from '@/common/dune/duneActionTitles';

describe('duneActionBoardTab', () => {
  it('opens the module board of a Dune move', () => {
    expect(duneBoardTabOf(SMUGGLE_SPICE_TITLE)).eq('smuggling');
    expect(duneBoardTabOf(BLACK_MARKET_TITLE)).eq('smuggling');
    expect(duneBoardTabOf(CHOAM_OFFER_TITLE)).eq('choam');
    expect(duneBoardTabOf(OPEN_KANLY_TITLE)).eq('kanly');
    expect(duneBoardTabOf(KANLY_SEND_TITLE)).eq('kanly');
    expect(duneBoardTabOf(WORM_TITLE)).eq('worm');
  });

  it('leaves Mars actions alone', () => {
    expect(duneBoardTabOf('Play project card')).is.undefined;
    expect(duneBoardTabOf('Standard projects')).is.undefined;
  });
});
