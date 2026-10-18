import {mount, shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CardDescription from '@/client/components/card/CardDescription.vue';

describe('CardDescription', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(CardDescription, {
      ...globalConfig,
      props: {
        item: 'A test description',
      },
    });
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('.card-asterisk-note').exists()).to.be.false;
  });

  it('shows the asterisk rule as a separate note with highlighted words', () => {
    const wrapper = mount(CardDescription, {
      ...globalConfig,
      props: {
        item: 'Oxygen must be 4% or less. Place this tile NEXT TO NO OTHER TILE. Increase your M€ production 1 step.',
      },
    });
    expect(wrapper.text()).to.contain('(Oxygen must be 4% or less. Increase your M€ production 1 step.)');
    expect(wrapper.find('.card-asterisk-note').text()).to.contain('Place this tile next to no other tile.');
    expect(wrapper.find('.card-asterisk-note mark').text()).to.eq('next to no other tile');
  });
});
