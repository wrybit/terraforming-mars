import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlanetsBoard from '@/client/components/pathfinders/PlanetsBoard.vue';
import {rewardBonus, trackLane} from '@/client/components/pathfinders/planetTrackRewards';
import {PLANETARY_TRACKS} from '@/common/pathfinders/PlanetaryTracks';
import {fakeGameOptionsModel} from '../testHelpers';

describe('PlanetsBoard', () => {
  it('shows five tracks with the marker and the tags missing for the next reward', () => {
    const model = {venus: 2, earth: 0, mars: 4, jovian: 0, moon: 1};
    const wrapper = mount(PlanetsBoard, {...globalConfig, props: {model, gameOptions: fakeGameOptionsModel()}});
    expect(wrapper.findAll('.board-track-row')).has.length(5);
    const venus = wrapper.find('[data-test="planet-track-venus"]');
    expect(venus.find('.board-track-row__cell--at').text()).eq('2');
    // Venus rewards at 3: one tag missing
    expect(venus.find('.board-track-row__big').text()).contains('1×');
  });

  it('turns rewards into chips: own, everyone, handed out', () => {
    const lane = trackLane(PLANETARY_TRACKS.mars.spaces, 2, true);
    // Mars track: space 2 gives steel to everyone – reached, so handed out
    expect(lane[2].map((entry) => entry.kind)).deep.eq(['done']);
    expect(lane[5].map((entry) => entry.kind)).deep.eq(['own', 'everyone']);
    expect(rewardBonus('delegate', false)).deep.eq({icons: ['resources/megacredit.png'], count: 3});
  });
});
