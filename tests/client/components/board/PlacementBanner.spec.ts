import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlacementBanner from '@/client/components/board/PlacementBanner.vue';
import {PlacementDescription} from '@/client/components/board/placementDescription';

const description: PlacementDescription = {
  tile: 'mine',
  title: 'Place mine',
  gains: [{icon: 'mining-rate', value: '+1', label: 'Mining rate'}, {icon: 'tr', value: '+1', label: 'TR'}],
  rules: [{kind: 'required', text: 'Only on mining spaces'}, {kind: 'card', text: 'Select a mining space to co-own'}],
};

describe('PlacementBanner', () => {
  it('shows tile, gains and rules in the Moon tone', () => {
    const wrapper = mount(PlacementBanner, {...globalConfig, props: {description}});
    expect(wrapper.classes()).to.include('placement-banner--tone-moon');
    expect(wrapper.find('.placement-banner-icon--mine').exists()).is.true;
    expect(wrapper.find('.placement-banner-title').text()).eq('Place mine');
    expect(wrapper.findAll('.placement-gain')).has.length(2);
    expect(wrapper.findAll('.placement-rule')).has.length(2);
    expect(wrapper.find('.placement-rule--card .placement-rule-card').exists()).is.true;
  });
});
