import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import HelpKeyboardShortcuts from '@/client/components/helpOverlay/HelpKeyboardShortcuts.vue';
import {HOTKEY_ACTIONS} from '@/client/hotkeys/hotkeyActions';

describe('HelpKeyboardShortcuts', () => {
  it('lists every shortcut read-only', () => {
    const wrapper = mount(HelpKeyboardShortcuts, {...globalConfig});
    expect(wrapper.findAll('.hotkey-row').length).to.be.at.least(HOTKEY_ACTIONS.length);
    expect(wrapper.findAll('button.hotkey-row')).has.length(0);
  });

  it('draws the keyboard and links a hovered row to its key', async () => {
    const wrapper = mount(HelpKeyboardShortcuts, {...globalConfig});
    expect(wrapper.find('.hotkey-keyboard').exists()).to.equal(true);
    const projects = wrapper.findAll('.hotkey-row').find((row) => row.text().includes('Projects'));
    await projects!.trigger('mouseenter');
    expect(wrapper.find('[data-key="E"]').classes()).to.include('hotkey-keyboard__key--lit');
  });
});
