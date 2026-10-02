import {shallowMount} from '@vue/test-utils';
import {vi} from 'vitest';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import StartScreen from '@/client/components/StartScreen.vue';

describe('StartScreen', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(StartScreen, {
      ...globalConfig,
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('lists statistics second and gives every button its own background row', () => {
    const wrapper = shallowMount(StartScreen, {
      ...globalConfig,
    });
    const links = wrapper.findAll('a.start-screen-link');
    expect(links).has.length(8);
    expect(links[1].attributes('href')).eq('stats');
    expect(links.map((link) => link.attributes('style'))).to.deep.eq(
      [1, 2, 3, 4, 5, 6, 7, 8].map((row) => `--sprite-row: ${row};`));
  });

  it('shows an icon on every menu entry', () => {
    const wrapper = shallowMount(StartScreen, {
      ...globalConfig,
    });
    const icons = wrapper.findAll('a.start-screen-link .start-screen-link-icon');
    expect(icons).has.length(8);
    expect(new Set(icons.map((icon) => icon.attributes('name'))).size).eq(8);
  });

  it('opens everything except "New game" in a new tab', () => {
    const wrapper = shallowMount(StartScreen, {
      ...globalConfig,
    });
    const targets = wrapper.findAll('a.start-screen-link').map((link) => link.attributes('target'));
    expect(targets).to.deep.eq([undefined, ...Array(7).fill('_blank')]);
  });

  it('highlights on the first tap and opens the link on the second tap', async () => {
    vi.useFakeTimers();
    try {
      const wrapper = shallowMount(StartScreen, {...globalConfig});
      const link = wrapper.findAll('a.start-screen-link')[2];
      const tap = async () => {
        await link.trigger('pointerdown', {pointerType: 'touch'});
        const event = new MouseEvent('click', {bubbles: true, cancelable: true});
        link.element.dispatchEvent(event);
        return event.defaultPrevented;
      };
      expect(await tap()).to.be.true;
      vi.advanceTimersByTime(400);
      await wrapper.vm.$nextTick();
      expect(link.classes()).to.include('start-screen-link--active');
      expect(await tap()).to.be.false;
    } finally {
      vi.useRealTimers();
    }
  });

  it('opens the link directly on a double tap without highlighting first', async () => {
    vi.useFakeTimers();
    try {
      const wrapper = shallowMount(StartScreen, {...globalConfig});
      const link = wrapper.findAll('a.start-screen-link')[3];
      await link.trigger('pointerdown', {pointerType: 'touch'});
      const first = new MouseEvent('click', {bubbles: true, cancelable: true});
      link.element.dispatchEvent(first);
      vi.advanceTimersByTime(100);
      const second = new MouseEvent('click', {bubbles: true, cancelable: true});
      link.element.dispatchEvent(second);
      expect(first.defaultPrevented).to.be.true;
      expect(second.defaultPrevented).to.be.false;
      vi.advanceTimersByTime(400);
      await wrapper.vm.$nextTick();
      expect(link.classes()).not.to.include('start-screen-link--active');
    } finally {
      vi.useRealTimers();
    }
  });
});
