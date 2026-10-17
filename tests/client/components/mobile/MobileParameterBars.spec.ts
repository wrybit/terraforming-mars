import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobileParameterBars from '@/client/components/mobile/MobileParameterBars.vue';
import {parameterBars} from '@/client/components/mobile/parameterBars';
import {BoardName} from '@/common/boards/BoardName';

describe('MobileParameterBars', () => {
  it('renders three bars without Venus', () => {
    const wrapper = mount(MobileParameterBars, {
      ...globalConfig,
      props: {temperature: -16, oxygen: 5, oceans: 4, venus: undefined},
    });
    expect(wrapper.findAll('.mb-param')).to.have.length(3);
    expect(wrapper.find('.mb-param--temperature .mb-param-value').text()).to.eq('-16 °C');
  });

  it('adds Venus and marks completed parameters', () => {
    const bars = parameterBars({temperature: 8, oxygen: 14, oceans: 9, venus: 10});
    expect(bars.map((bar) => bar.key)).to.deep.eq(['temperature', 'oxygen', 'oceans', 'venus']);
    expect(bars.slice(0, 3).every((bar) => bar.done && bar.percent === 100)).to.be.true;
    expect(bars[3].done).to.be.false;
  });

  it('places bonus markers on the scale', () => {
    const temperature = parameterBars({temperature: -30, oxygen: 0, oceans: 0, venus: undefined})[0];
    // 0 °C liegt bei 30 von 38 Grad
    expect(temperature.bonuses.find((bonus) => bonus.kind === 'ocean')?.percent).to.eq(78.9);
    expect(temperature.percent).to.eq(0);
  });

  it('uses the maximums of the map', () => {
    const bars = parameterBars({temperature: 8, oxygen: 14, oceans: 9, venus: 30, boardName: BoardName.AMAZONIS_PLANITIA});
    expect(bars.map((bar) => bar.max)).to.deep.eq([14, 18, 11, 33]);
    expect(bars.some((bar) => bar.done)).to.be.false;
    expect(bars[2].text).to.eq('9/11');
    // Venus: 15 steps of 2 % up to 30 %, then 3 steps of 1 %
    expect(bars[3].steps).to.eq(18);
  });
  it('shows the track bonuses of the map', () => {
    const kinds = (boardName?: BoardName) => parameterBars({temperature: -30, oxygen: 0, oceans: 0, venus: 0, boardName})
      .map((bar) => bar.bonuses.map((bonus) => bonus.kind + '@' + bonus.at));
    expect(kinds()).to.deep.eq([['heat@-24', 'heat@-20', 'ocean@0'], ['temperature@8'], [], ['card@8', 'tr@16']]);
    expect(kinds(BoardName.AMAZONIS_PLANITIA)).to.deep.eq([
      ['heat@-24', 'heat@-20', 'plant@-12', 'ocean@0'],
      ['card@7', 'temperature@11'],
      [],
      ['card@8', 'colony@16', 'tr@22'],
    ]);
  });
});
