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
    const keys = wrapper.findAll('.hotkey-keyboard__key').map((key) => key.attributes('data-key'));
    expect(keys.indexOf('Z')).to.be.lessThan(keys.indexOf('U'));
    const projects = wrapper.find('[data-key="E"]');
    expect(projects.classes()).to.include('hotkey-keyboard__key--tabs-default');
    expect(projects.find('.hotkey-keyboard__use').text()).to.equal('Projects');
    expect(wrapper.find('[data-key="X"]').classes()).to.include('hotkey-keyboard__key--danger');
  });

  it('follows changed bindings at once', async () => {
    const wrapper = mountKeyboard('en');
    setBinding('tab-projects', ['M']);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-key="M"]').classes()).to.include('hotkey-keyboard__key--tabs-default');
  });

  it('leaves out the tabs of expansions the game does not have', () => {
    const wrapper = mount(HotkeyKeyboard, {...globalConfig, props: {language: 'en', expansions: ['colonies'], editing: false, highlighted: new Set<string>(), pressed: new Set<string>(), modArmed: false}});
    expect(wrapper.find('[data-key="G"]').classes()).not.to.include('hotkey-keyboard__key--tabs-expansion');
    expect(wrapper.find('[data-key="H"]').classes()).to.include('hotkey-keyboard__key--tabs-expansion');
  });

  it('has arrow up and down as two half keys', () => {
    const wrapper = mountKeyboard('en');
    expect(wrapper.findAll('.hotkey-keyboard__stack .hotkey-keyboard__key--half')).has.length(2);
  });
});
