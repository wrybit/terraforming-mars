import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import BoardTabLines from '@/client/components/boardTabs/BoardTabLines.vue';

describe('BoardTabLines', () => {
  it('fills the track up to the step, marks the next bonus and the passed ones only', () => {
    const wrapper = mount(BoardTabLines, {...globalConfig, props: {tracks: [{color: '#fff', step: 4, total: 8, bonus: [1, 3, 6, 8]}]}});
    const cells = wrapper.findAll('.board-tab-line i');
    expect(cells).has.length(8);
    expect(wrapper.findAll('.board-tab-line__on')).has.length(4);
    expect(cells[0].classes()).includes('board-tab-line__claimed');
    expect(cells[2].classes()).includes('board-tab-line__claimed');
    expect(cells[5].classes()).includes('board-tab-line__next');
    // Later bonuses stay unmarked
    expect(cells[7].classes()).not.includes('board-tab-line__next');
    expect(cells[7].classes()).not.includes('board-tab-line__claimed');
  });

  it('marks no passed bonus on the Delta line with player markers', () => {
    const wrapper = mount(BoardTabLines, {...globalConfig, props: {tracks: [{color: '#fff', step: 12, total: 12, bonus: [11, 12], markers: [{at: 3, color: 'red'}]}]}});
    expect(wrapper.findAll('.board-tab-line__claimed')).has.length(0);
  });
});
