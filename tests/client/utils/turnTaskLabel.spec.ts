import {expect} from 'chai';
import {turnTaskLabel} from '@/client/utils/turnTaskLabel';
import {Phase} from '@/common/Phase';

describe('turnTaskLabel', () => {
  it('maps phases to task labels', () => {
    expect(turnTaskLabel({phase: Phase.DRAFTING, generation: 3})).to.eq('Draft');
    expect(turnTaskLabel({phase: Phase.RESEARCH, generation: 1})).to.eq('Opening');
    expect(turnTaskLabel({phase: Phase.RESEARCH, generation: 2})).to.eq('Buying');
    expect(turnTaskLabel({phase: Phase.PRELUDES, generation: 1})).to.eq('Prelude');
    expect(turnTaskLabel({phase: Phase.ACTION, generation: 3})).to.eq('Play');
    expect(turnTaskLabel({phase: Phase.SOLAR, generation: 3})).to.eq('Solar phase');
    expect(turnTaskLabel({phase: Phase.INTERGENERATION, generation: 3})).to.eq('Your turn');
  });
});
