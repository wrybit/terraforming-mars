import {shallowMount} from '@vue/test-utils';
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

  it('lists statistics third and gives every button its own background row', () => {
    const wrapper = shallowMount(StartScreen, {
      ...globalConfig,
    });
    const links = wrapper.findAll('a.start-screen-link');
    expect(links).has.length(8);
    expect(links[2].attributes('href')).eq('stats');
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
});
