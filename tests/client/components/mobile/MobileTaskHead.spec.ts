import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobileTaskHead from '@/client/components/mobile/MobileTaskHead.vue';

describe('MobileTaskHead', () => {
  it('shows title, count, tone and the slot for the card filter', async () => {
    const wrapper = mount(MobileTaskHead, {...globalConfig, props: {title: 'Projects', sub: 4, tone: 'success'}});
    expect(wrapper.find('.mb-task-title').text()).to.eq('Projects');
    expect(wrapper.find('.mb-task-sub').text()).to.eq('4');
    expect(wrapper.classes()).to.contain('mb-task-head--success');
    expect(wrapper.find('.mb-task-tools').exists()).to.be.true;
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('back')).to.have.length(1);
  });

  it('can do without the back button', () => {
    const wrapper = mount(MobileTaskHead, {...globalConfig, props: {title: 'All cards', back: false}});
    expect(wrapper.find('button').exists()).to.be.false;
    expect(wrapper.find('.mb-task-sub').exists()).to.be.false;
  });
});
