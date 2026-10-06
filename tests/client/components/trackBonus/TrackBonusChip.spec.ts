import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import TrackBonusChip from '@/client/components/trackBonus/TrackBonusChip.vue';

describe('TrackBonusChip', () => {
  it('shows the icon, production box and state', () => {
    const wrapper = mount(TrackBonusChip, {...globalConfig, props: {bonus: {icons: ['resources/steel.png'], production: true}, kind: 'done'}});
    expect(wrapper.classes()).includes('track-bonus-chip--done');
    expect(wrapper.find('.track-bonus-chip__production img').attributes('src')).eq('assets/resources/steel.png');
  });

  it('shows a choice as a capsule and victory points as a number', () => {
    const choice = mount(TrackBonusChip, {...globalConfig, props: {bonus: {icons: ['resources/steel.png', 'resources/plant.png'], count: 2}}});
    expect(choice.classes()).includes('track-bonus-chip--choice');
    expect(choice.find('b').text()).eq('2');
    const points = mount(TrackBonusChip, {...globalConfig, props: {bonus: {icons: [], victoryPoints: 5}}});
    expect(points.find('.track-bonus-chip__vp').text()).eq('5');
  });
});
