import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ColoniesBoard from '@/client/components/colonies/ColoniesBoard.vue';
import {setColonyPreview} from '@/client/components/colonies/colonyTradeState';
import {ColonyName} from '@/common/colonies/ColonyName';
import {fakePublicPlayerModel} from '../testHelpers';
import {fakeColony} from './coloniesFixtures';

describe('ColoniesBoard', () => {
  afterEach(() => setColonyPreview(undefined));

  const players = [fakePublicPlayerModel({color: 'red', name: 'Lena', fleetSize: 1})];

  it('shows each tile with track, trade value and the best trade', () => {
    const colonies = [fakeColony(ColonyName.LUNA, {trackPosition: 2}), fakeColony(ColonyName.IO), fakeColony(ColonyName.MIRANDA, {isActive: false})];
    const wrapper = mount(ColoniesBoard, {...globalConfig, props: {colonies, players}});
    const luna = wrapper.find('[data-test="colony-tile-Luna"]');
    expect(luna.classes()).includes('colonies-board__tile--best');
    // Luna track 1, 2, 4, 7 …: marker on step 3 shows 4 M€
    expect(luna.find('.colonies-board__big').text()).contains('4');
    expect(luna.findAll('.colonies-board__step')).has.length(7);
    expect(wrapper.find('[data-test="colony-tile-Miranda"]').classes()).includes('colonies-board__tile--off');
  });

  it('shows colony cubes on the slots and docked fleets', () => {
    const colonies = [fakeColony(ColonyName.LUNA, {colonies: ['red'], visitor: 'red'})];
    const wrapper = mount(ColoniesBoard, {...globalConfig, props: {colonies, players}});
    expect(wrapper.find('.colonies-board__step--colony').exists()).is.true;
    expect(wrapper.find('.colonies-board__docked').text()).contains('Lena');
    expect(wrapper.find('.colonies-board__berth--away').exists()).is.true;
  });

  it('previews a trade: marker drop and the owners getting the bonus', async () => {
    const colonies = [fakeColony(ColonyName.LUNA, {trackPosition: 4, colonies: ['blue']})];
    const wrapper = mount(ColoniesBoard, {...globalConfig, props: {colonies, players, viewerColor: 'red'}});
    setColonyPreview('trade', ColonyName.LUNA);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.colonies-board__tile--pick').exists()).is.true;
    expect(wrapper.find('.colonies-board__step--gets').exists()).is.true;
    expect(wrapper.find('.colonies-board__step--reset').exists()).is.true;
  });
});
