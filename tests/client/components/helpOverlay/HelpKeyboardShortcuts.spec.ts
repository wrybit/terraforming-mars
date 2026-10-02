import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import HelpKeyboardShortcuts from '@/client/components/helpOverlay/HelpKeyboardShortcuts.vue';

describe('HelpKeyboardShortcuts', () => {
  it('shows each shortcut with exactly one highlighted area', () => {
    const wrapper = mount(HelpKeyboardShortcuts, {...globalConfig});
    const shortcuts = wrapper.findAll('.help-shortcut-grid .help-shortcut').filter((shortcut) => shortcut.find('.help-sketch').exists());
    expect(shortcuts).has.length(4);
    for (const shortcut of shortcuts) {
      expect(shortcut.findAll('.help-sketch-area--target')).has.length(1);
    }
  });
});
