import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import HotkeyKeys from '@/client/components/hotkeys/HotkeyKeys.vue';

describe('HotkeyKeys', () => {
  it('shows the keys of an action as caps', () => {
    const wrapper = mount(HotkeyKeys, {...globalConfig, props: {action: 'confirm'}});
    expect(wrapper.findAll('kbd').map((key) => key.text())).to.deep.equal(['↵']);
  });

  it('renders nothing for an action without keys', () => {
    const wrapper = mount(HotkeyKeys, {...globalConfig, props: {fixed: []}});
    expect(wrapper.find('kbd').exists()).to.equal(false);
  });
});
