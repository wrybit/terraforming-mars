import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MilestoneAwardIcon from '@/client/components/milestoneAwardTable/MilestoneAwardIcon.vue';

describe('MilestoneAwardIcon', () => {
  it('shows every part, production in its box, and the requirement on top', () => {
    const wrapper = shallowMount(MilestoneAwardIcon, {
      ...globalConfig,
      props: {
        parts: [{asset: 'resources/steel', production: true}, {asset: 'resources/titanium', production: true}],
        requirement: 6,
      },
    });
    expect(wrapper.findAll('img').map((image) => image.attributes('src'))).to.deep.eq(['assets/resources/steel.png', 'assets/resources/titanium.png']);
    expect(wrapper.findAll('.ma-table-icon-production')).to.have.length(2);
    expect(wrapper.find('[data-test="requirement"]').text()).to.eq('6');
  });

  it('moves the requirement to the optical center of asymmetric images', () => {
    const wrapper = shallowMount(MilestoneAwardIcon, {
      ...globalConfig,
      props: {parts: [{asset: 'tiles/greenery', centerX: 43}], requirement: 3},
    });
    expect(wrapper.find('[data-test="requirement"]').attributes('style')).to.contain('left: 43%');
  });
});
