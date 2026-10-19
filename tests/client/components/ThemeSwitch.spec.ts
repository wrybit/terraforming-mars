import {flushPromises, mount} from '@vue/test-utils';
import {expect} from 'chai';
import {afterEach, beforeEach, vi} from 'vitest';
import {globalConfig} from '@tests/client/components/getLocalVue';
import ThemeSwitch from '@/client/components/common/ThemeSwitch.vue';
import {activeTheme, applyTheme} from '@/client/theme/applyTheme';
import {chosenTheme} from '@/client/theme/themeChoice';

describe('ThemeSwitch', () => {
  beforeEach(() => {
    localStorage.clear();
    // The Dune texts come from the server; the switch only needs the answer
    vi.stubGlobal('fetch', vi.fn(async () => ({json: async () => ({})})));
  });

  afterEach(async () => {
    await applyTheme('mars');
    vi.unstubAllGlobals();
  });

  it('shows Mars with its planet when nothing was picked yet', () => {
    const wrapper = mount(ThemeSwitch, {...globalConfig});
    const options = wrapper.findAll('[role="radio"]');
    expect(options.map((option) => option.text())).deep.eq(['Mars', 'Dune']);
    expect(options[0].attributes('aria-checked')).eq('true');
    expect(wrapper.find('.theme-switch__planet').classes()).contains('theme-switch__planet--mars');
    expect(wrapper.find('.theme-switch__surface--shown').classes()).contains('theme-switch__surface--mars');
  });

  it('switches to Dune, remembers the choice and tells the page first', async () => {
    vi.useFakeTimers();
    const wrapper = mount(ThemeSwitch, {...globalConfig});
    await wrapper.findAll('[role="radio"]')[1].trigger('click');
    // The planet rolls in first, the page follows afterwards
    expect(wrapper.find('.theme-switch__planet').classes()).contains('theme-switch__planet--dune');
    expect(wrapper.emitted('switch')).is.undefined;
    await vi.advanceTimersByTimeAsync(800);
    vi.useRealTimers();
    await flushPromises();
    expect(wrapper.emitted('switch')).deep.eq([['dune']]);
    expect(activeTheme()).eq('dune');
    expect(chosenTheme()).eq('dune');
    expect(wrapper.find('.theme-switch__planet').classes()).contains('theme-switch__planet--dune');
  });

  it('does nothing when the shown theme is picked again', async () => {
    const wrapper = mount(ThemeSwitch, {...globalConfig});
    await wrapper.findAll('[role="radio"]')[0].trigger('click');
    expect(wrapper.emitted('switch')).is.undefined;
  });
});
