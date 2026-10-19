import {expect} from 'chai';
import {duneBoardTabOf} from '@/client/components/dune/duneActionBoardTab';
import {
  CHOAM_OFFER_TITLE, KANLY_SEND_TITLE, OPEN_KANLY_TITLE, SMUGGLE_TITLE, WORM_TITLE,
} from '@/common/dune/duneActionTitles';

describe('duneActionBoardTab', () => {
  it('opens the module board of a Dune move', () => {
    expect(duneBoardTabOf(CHOAM_OFFER_TITLE)).eq('choam');
    expect(duneBoardTabOf(OPEN_KANLY_TITLE)).eq('kanly');
    expect(duneBoardTabOf(KANLY_SEND_TITLE)).eq('kanly');
    expect(duneBoardTabOf(WORM_TITLE)).eq('worm');
  });

  it('keeps the board for smuggling: its track is in its own action tab', () => {
    expect(duneBoardTabOf(SMUGGLE_TITLE)).is.undefined;
  });

  it('leaves Mars actions alone', () => {
    expect(duneBoardTabOf('Play project card')).is.undefined;
    expect(duneBoardTabOf('Standard projects')).is.undefined;
  });
});
