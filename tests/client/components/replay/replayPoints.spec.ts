import {expect} from 'chai';
import {replayVictoryPoints} from '@/client/components/replay/replayPoints';

describe('replayVictoryPoints', () => {
  it('adds the rest of the last finished generation to the live TR and ends with the final total', () => {
    const generations = [{number: 1, start: 0, count: 2}, {number: 2, start: 2, count: 3}];
    // End of generation 1: TR 21, 24 points → 3 points without TR
    const points = replayVictoryPoints([20, 21, 21, 22, 23], generations, [24, 30], 31);
    expect(points).deep.eq([20, 21, 24, 25, 31]);
  });

  it('shows the TR alone without recorded points', () => {
    expect(replayVictoryPoints([20, 21], [{number: 1, start: 0, count: 2}], [], 21)).deep.eq([20, 21]);
  });
});
