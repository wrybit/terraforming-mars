import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import BoardTabLines from '@/client/components/boardTabs/BoardTabLines.vue';

describe('BoardTabLines', () => {
  it('fills the track up to the step and marks the next bonus', () => {
    const wrapper = mount(BoardTabLines, {...globalConfig, props: {tracks: [{color: '#fff', step: 2, total: 8, bonus: [3, 6]}]}});
    const cells = wrapper.findAll('.board-tab-line i');
    expect(cells).has.length(8);
    expect(wrapper.findAll('.board-tab-line__on')).has.length(2);
    expect(cells[2].classes()).includes('board-tab-line__next');
    expect(cells[5].classes()).includes('board-tab-line__bonus');
  });
});
