import {expect} from 'chai';
import {findWinnerIndexes} from '../../../src/common/admin/findWinners';
import {toAdminPlayerSummaries} from '../../../src/common/admin/adminPlayerSummaries';

describe('findWinnerIndexes', () => {
  it('most victory points wins', () => {
    expect(findWinnerIndexes([{victoryPoints: 66, megaCredits: 63}, {victoryPoints: 76, megaCredits: 85}, {victoryPoints: 75, megaCredits: 69}])).deep.eq([1]);
  });

  it('M€ break a tie', () => {
    expect(findWinnerIndexes([{victoryPoints: 70, megaCredits: 10}, {victoryPoints: 70, megaCredits: 12}])).deep.eq([1]);
  });

  it('a full tie has several winners', () => {
    expect(findWinnerIndexes([{victoryPoints: 70, megaCredits: 10}, {victoryPoints: 70, megaCredits: 10}])).deep.eq([0, 1]);
  });

  it('no players, no winner', () => {
    expect(findWinnerIndexes([])).deep.eq([]);
  });
});

describe('toAdminPlayerSummaries', () => {
  const line = (name: string, victoryPoints: number) => ({name, color: 'red' as const, url: undefined, victoryPoints, megaCredits: 0});

  it('running games have no winner', () => {
    expect(toAdminPlayerSummaries([line('Jens', 50), line('Daniel', 40)], false, false).map((p) => p.isWinner)).deep.eq([false, false]);
  });

  it('solo game is only won when the solo goal was reached', () => {
    expect(toAdminPlayerSummaries([line('Jens', 50)], true, false)[0].isWinner).is.false;
    expect(toAdminPlayerSummaries([line('Jens', 50)], true, true)[0].isWinner).is.true;
  });
});
