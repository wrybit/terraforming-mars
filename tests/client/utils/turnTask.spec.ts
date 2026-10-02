import {expect} from 'chai';
import {turnTask} from '@/client/utils/turnTask';
import {Phase} from '@/common/Phase';

describe('turnTask', () => {
  it('maps phases to task labels and icons', () => {
    expect(turnTask({phase: Phase.DRAFTING, generation: 3})).to.deep.eq({label: 'Draft', icon: '🃏'});
    expect(turnTask({phase: Phase.RESEARCH, generation: 1})).to.deep.eq({label: 'Opening', icon: '🚀'});
    expect(turnTask({phase: Phase.RESEARCH, generation: 2})).to.deep.eq({label: 'Buying', icon: '🛒'});
    expect(turnTask({phase: Phase.PRELUDES, generation: 1})).to.deep.eq({label: 'Prelude', icon: '📜'});
    expect(turnTask({phase: Phase.ACTION, generation: 3})).to.deep.eq({label: 'Play', icon: '▶️'});
    expect(turnTask({phase: Phase.SOLAR, generation: 3})).to.deep.eq({label: 'Solar phase', icon: '☀️'});
    expect(turnTask({phase: Phase.INTERGENERATION, generation: 3})).to.deep.eq({label: 'Your turn', icon: '🔔'});
  });
});
