import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MilestoneAwardOwner from '@/client/components/milestoneAwardTable/MilestoneAwardOwner.vue';

describe('MilestoneAwardOwner', () => {
  it('shows cube and name in the color of the player', () => {
    const wrapper = shallowMount(MilestoneAwardOwner, {
      ...globalConfig,
      props: {color: 'green', playerName: 'Martin', flashKey: 'milestonesAwards.milestone.Mayor'},
    });
    expect(wrapper.classes()).to.include('ma-table-owner--green');
    expect(wrapper.find('.ma-table-cube').exists()).to.be.true;
    expect(wrapper.find('.ma-table-owner-name').text()).to.eq('Martin');
  });
});
