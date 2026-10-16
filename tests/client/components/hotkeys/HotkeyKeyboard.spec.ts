import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import HotkeyKeyboard from '@/client/components/hotkeys/HotkeyKeyboard.vue';
import {resetBindings, setBinding} from '@/client/hotkeys/hotkeyStore';

function mountKeyboard(language: string) {
  return mount(HotkeyKeyboard, {...globalConfig, props: {language, editing: false, highlighted: new Set<string>(), pressed: new Set<string>(), modArmed: false}});
}

describe('HotkeyKeyboard', () => {
  afterEach(() => {
    resetBindings();
  });

  it('draws QWERTZ for German and colors the keys with a shortcut', () => {
    const wrapper = mountKeyboard('de');
    const keys = wrapper.findAll('.hotkey-keyboard__key').map((key) => key.text());
    expect(keys.indexOf('Z')).to.be.lessThan(keys.indexOf('U'));
    const projects = wrapper.findAll('.hotkey-keyboard__key').find((key) => key.text() === 'J');
    expect(projects?.classes()).to.include('hotkey-keyboard__key--tabs');
  });

  it('follows changed bindings at once', async () => {
    const wrapper = mountKeyboard('en');
    setBinding('tab-projects', ['Y']);
    await wrapper.vm.$nextTick();
    const key = wrapper.findAll('.hotkey-keyboard__key').find((element) => element.text() === 'Y');
    expect(key?.classes()).to.include('hotkey-keyboard__key--tabs');
  });

  it('has arrow up and down as two half keys', () => {
    const wrapper = mountKeyboard('en');
    expect(wrapper.findAll('.hotkey-keyboard__stack .hotkey-keyboard__key--half')).has.length(2);
  });
});
