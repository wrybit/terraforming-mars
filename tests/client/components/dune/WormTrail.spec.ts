import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import WormTrail from '@/client/components/dune/WormTrail.vue';
import {WormTrailModel} from '@/common/dune/DuneModel';

describe('WormTrail', () => {
  const trail: WormTrailModel = {
    start: '48',
    moves: [
      {generation: 1, path: ['40', '31']},
      {generation: 2, path: []},
      {generation: 3, path: ['39']},
    ],
  };

  it('draws a line per move that went somewhere and a stop per space, with every generation it stopped there', () => {
    const wrapper = mount(WormTrail, {...globalConfig, props: {trail}});
    expect(wrapper.findAll('.worm-trail__line')).has.length(2);
    // Generation 2 was blocked: the worm stayed on the space of generation 1
    expect(wrapper.findAll('.worm-trail__stop text').map((text) => text.text())).deep.eq(['1, 2', '3']);
    expect(wrapper.findAll('.worm-trail__hex')).has.length(61);
  });

  it('shows only the starting space before the first move', () => {
    const wrapper = mount(WormTrail, {...globalConfig, props: {trail: {start: '48', moves: []}}});
    expect(wrapper.findAll('.worm-trail__line')).has.length(0);
    expect(wrapper.findAll('.worm-trail__stop')).has.length(0);
    expect(wrapper.find('.worm-trail__start').exists()).is.true;
  });
});
