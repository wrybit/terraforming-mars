import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import DeltaBoard from '@/client/components/delta/DeltaBoard.vue';
import {deltaNext} from '@/client/components/delta/deltaTrack';
import {Tag} from '@/common/cards/Tag';
import {fakePublicPlayerModel} from '../testHelpers';

describe('DeltaBoard', () => {
  it('shows one row per player with the marker and outlines the own row', () => {
    const players = [
      fakePublicPlayerModel({color: 'red', name: 'Lena', energy: 2, deltaProject: {position: 1, jovianBonus: false}}),
      fakePublicPlayerModel({color: 'blue', name: 'Sofia', energy: 0}),
    ];
    const wrapper = mount(DeltaBoard, {...globalConfig, props: {players, viewerColor: 'red'}});
    expect(wrapper.findAll('.delta-board__row')).has.length(2);
    expect(wrapper.find('[data-test="delta-row-red"]').classes()).includes('delta-board__row--self');
    expect(wrapper.find('[data-test="delta-row-blue"]').text()).contains('no energy');
  });

  it('knows why the next space is not reachable', () => {
    const player = fakePublicPlayerModel({energy: 1, deltaProject: {position: 0, jovianBonus: false}});
    expect(deltaNext(player)?.blocker).eq('tag');
    player.tags[Tag.BUILDING] = 1;
    expect(deltaNext(player)?.blocker).is.undefined;
  });
});
