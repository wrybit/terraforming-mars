import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import HotkeyKeys from '@/client/components/hotkeys/HotkeyKeys.vue';

describe('HotkeyKeys', () => {
  it('shows the keys of an action as caps', () => {
    const wrapper = mount(HotkeyKeys, {...globalConfig, props: {action: 'confirm'}});
    expect(wrapper.findAll('kbd')).has.length(1);
    // Symbols are drawn icons, so they sit centered in every font
    expect(wrapper.find('kbd svg.hotkey-key__icon').exists()).to.equal(true);
  });

  it('writes letters as text', () => {
    const wrapper = mount(HotkeyKeys, {...globalConfig, props: {action: 'tab-projects'}});
    expect(wrapper.find('kbd').text()).to.equal('E');
  });

  it('renders nothing for an action without keys', () => {
    const wrapper = mount(HotkeyKeys, {...globalConfig, props: {fixed: []}});
    expect(wrapper.find('kbd').exists()).to.equal(false);
  });
});
