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
});
