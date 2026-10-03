import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import CardFilterEmptyHint from '@/client/components/cardfilter/CardFilterEmptyHint.vue';

describe('CardFilterEmptyHint', () => {
  it('offers to reset the filters', async () => {
    const wrapper = mount(CardFilterEmptyHint, {...globalConfig});
    expect(wrapper.text()).to.include('No card matches these filters.');
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('reset')).to.have.length(1);
  });
});
