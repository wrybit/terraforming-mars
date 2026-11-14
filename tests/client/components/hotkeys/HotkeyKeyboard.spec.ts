import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import HotkeyKeyboard from '@/client/components/hotkeys/HotkeyKeyboard.vue';
import {resetBindings, setBinding} from '@/client/hotkeys/hotkeyStore';
import {detectedLayout} from '@/client/hotkeys/hotkeyKeyLabels';

function mountKeyboard(language: string) {
  return mount(HotkeyKeyboard, {...globalConfig, props: {language, editing: false, highlighted: new Set<string>(), pressed: new Set<string>(), modArmed: false}});
}

describe('HotkeyKeyboard', () => {
  afterEach(() => {
    resetBindings();
    detectedLayout.value = undefined;
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

  it('does not show invented letters before the layout is known', () => {
    const wrapper = mountKeyboard('en');
    expect(wrapper.find('[data-key="Q"]').text()).to.include('·');
    expect(wrapper.find('[data-key="1"]').text()).to.include('1');
  });

  it('follows changed bindings at once', async () => {
    const wrapper = mountKeyboard('en');
    setBinding('tab-projects', ['KeyM']);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-key="M"]').classes()).to.include('hotkey-keyboard__key--tabs-default');
  });

  it('leaves out the tabs of expansions the game does not have', () => {
    const wrapper = mount(HotkeyKeyboard, {...globalConfig, props: {language: 'en', expansions: ['colonies'], editing: false, highlighted: new Set<string>(), pressed: new Set<string>(), modArmed: false}});
    expect(wrapper.find('[data-key="G"]').classes()).not.to.include('hotkey-keyboard__key--tabs-expansion');
    expect(wrapper.find('[data-key="H"]').classes()).to.include('hotkey-keyboard__key--tabs-expansion');
  });

  it('labels the keys with the real layout of the device (AZERTY), the shortcuts stay on their position', async () => {
    detectedLayout.value = new Map([['KeyQ', 'a'], ['KeyA', 'q'], ['KeyW', 'z']]);
    const wrapper = mountKeyboard('en');
    await wrapper.vm.$nextTick();
    const allCards = wrapper.find('[data-key="Q"]');
    expect(allCards.text()).to.include('A');
    expect(allCards.find('.hotkey-keyboard__use').text()).to.equal('Cards');
    expect(wrapper.find('[data-key="A"] .hotkey-keyboard__use').text()).to.equal('Corporation');
  });

  it('updates the drawn caps when the detected layout arrives while the dialog is open', async () => {
    const wrapper = mountKeyboard('en');
    expect(wrapper.find('[data-key="Q"]').text()).to.include('·');

    detectedLayout.value = new Map([['KeyQ', 'a'], ['KeyA', 'q']]);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-key="Q"]').text()).to.include('A');
    expect(wrapper.find('[data-key="Q"] .hotkey-keyboard__use').text()).to.equal('Cards');
  });

  it('shows the number keys without repeating the choose label', () => {
    const wrapper = mountKeyboard('en');
    for (const digit of '1234567890') {
      const key = wrapper.find(`[data-key="${digit}"]`);
      expect(key.text()).to.include(digit);
      expect(key.find('.hotkey-keyboard__use').exists()).to.be.false;
    }
  });

  it('has arrow up and down as two half keys', () => {
    const wrapper = mountKeyboard('en');
    expect(wrapper.findAll('.hotkey-keyboard__stack .hotkey-keyboard__key--half')).has.length(2);
  });
});
