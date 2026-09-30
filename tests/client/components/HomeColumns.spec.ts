import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import HomeColumns from '@/client/components/HomeColumns.vue';

describe('HomeColumns', () => {
  it('puts the slots into the board and main columns', () => {
    const wrapper = mount(HomeColumns, {
      ...globalConfig,
      slots: {board: '<div class="board-content"/>', main: '<div class="main-content"/>'},
    });
    expect(wrapper.find('.player-home-columns__board .board-content').exists()).to.be.true;
    expect(wrapper.find('.player-home-columns__main .main-content').exists()).to.be.true;
    expect(wrapper.find('.player-home-columns__resizer').exists()).to.be.true;
  });

  it('marks the board as collapsed', () => {
    const wrapper = mount(HomeColumns, {...globalConfig, props: {boardCollapsed: true}});
    expect(wrapper.classes()).to.include('player-home-columns--board-collapsed');
  });
});
