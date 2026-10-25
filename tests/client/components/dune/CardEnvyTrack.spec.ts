import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CardEnvyTrack from '@/client/components/dune/CardEnvyTrack.vue';

describe('CardEnvyTrack', () => {
  it('splits the track into free and hit steps and shows the lost influence', () => {
    const wrapper = mount(CardEnvyTrack, {...globalConfig, props: {item: {is: 'envy-track', hitFrom: 3, influenceLoss: 1}}});
    const free = wrapper.findAll('.card-envy-track__steps--free .card-envy-track__step').map((step) => step.text());
    const hit = wrapper.findAll('.card-envy-track__hit .card-envy-track__step').map((step) => step.text());
    expect(free).deep.eq(['0', '1', '2']);
    expect(hit).deep.eq(['3', '4', '5']);
    expect(wrapper.findAll('.card-envy-track__influence')).has.length(1);
  });
});
