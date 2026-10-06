import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import PageToolbar from '@/client/components/PageToolbar.vue';
import GameMenu from '@/client/components/gameMenu/GameMenu.vue';

describe('PageToolbar', () => {
  it('shows the setup menu (language, help, settings)', () => {
    const wrapper = shallowMount(PageToolbar, {
      ...globalConfig,
    });
    expect(wrapper.find('.page-toolbar').exists()).to.be.true;
    expect(wrapper.findComponent(GameMenu).exists()).to.be.true;
  });
});
