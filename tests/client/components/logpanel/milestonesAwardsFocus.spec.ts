import {expect} from 'chai';
import {focusMilestonesAwards, milestonesAwardsFocusState} from '@/client/components/logpanel/milestonesAwardsFocus';

describe('milestonesAwardsFocus', () => {
  it('stays focused until every choice released it', () => {
    const releaseOld = focusMilestonesAwards();
    const releaseNew = focusMilestonesAwards();
    releaseOld();
    expect(milestonesAwardsFocusState.requests).to.eq(1);
    releaseNew();
    expect(milestonesAwardsFocusState.requests).to.eq(0);
  });

  it('releases only once', () => {
    const release = focusMilestonesAwards();
    release();
    release();
    expect(milestonesAwardsFocusState.requests).to.eq(0);
  });
});
