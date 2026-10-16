import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import HotkeyRow from '@/client/components/hotkeys/HotkeyRow.vue';
import {findHotkeyAction} from '@/client/hotkeys/hotkeyActions';

describe('HotkeyRow', () => {
  it('shows the key and the label', () => {
    const wrapper = mount(HotkeyRow, {...globalConfig, props: {row: findHotkeyAction('tab-projects')!, editing: false, capturing: false, duplicate: false}});
    expect(wrapper.find('kbd').text()).to.equal('J');
    expect(wrapper.text()).to.include('Projects');
  });

  it('marks a key assigned twice', () => {
    const wrapper = mount(HotkeyRow, {...globalConfig, props: {row: findHotkeyAction('tab-projects')!, editing: true, capturing: false, duplicate: true}});
    expect(wrapper.find('.hotkey-row').classes()).to.include('hotkey-row--duplicate');
  });
});
