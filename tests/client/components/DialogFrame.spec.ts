import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import DialogFrame from '@/client/components/DialogFrame.vue';

describe('DialogFrame', () => {
  it('shows title, content and footer and emits close', async () => {
    const wrapper = shallowMount(DialogFrame, {
      ...globalConfig,
      props: {title: 'Language', width: 640},
      slots: {default: '<p class="content">x</p>', footer: '<button class="ok">Ok</button>'},
    });
    expect(wrapper.find('.dialog-frame-title').text()).eq('Language');
    expect(wrapper.find('.dialog-frame-body .content').exists()).is.true;
    expect(wrapper.find('.dialog-frame-foot .ok').exists()).is.true;
    await wrapper.find('.dialog-frame-close').trigger('click');
    expect(wrapper.emitted('close')).has.length(1);
  });

  it('has no footer without footer slot', () => {
    const wrapper = shallowMount(DialogFrame, {...globalConfig, props: {title: 'Info', width: 760}});
    expect(wrapper.find('.dialog-frame-foot').exists()).is.false;
  });
});
