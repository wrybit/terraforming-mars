import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import TurmoilBoard from '@/client/components/turmoil/TurmoilBoard.vue';
import {turmoilPickState} from '@/client/components/turmoil/turmoilView';
import {PartyName} from '@/common/turmoil/PartyName';
import {fakePublicPlayerModel} from '../testHelpers';
import {fakeTurmoil} from './turmoilFixtures';

describe('TurmoilBoard', () => {
  afterEach(() => turmoilPickState.pick = undefined);

  const players = [fakePublicPlayerModel({color: 'red', influence: 1})];

  it('shows the ruling policy, one wedge per party, lobby and own reserve', () => {
    const wrapper = mount(TurmoilBoard, {...globalConfig, props: {turmoil: fakeTurmoil(), players, viewerColor: 'red', generation: 3}});
    expect(wrapper.find('.turmoil-board-tab__policy').text()).contains('Greens');
    expect(wrapper.findAll('.turmoil-board-tab__wedge')).has.length(6);
    expect(wrapper.find('.turmoil-board-tab__dominance').exists()).is.true;
    expect(wrapper.findAll('.turmoil-board-tab__corner--left img')).has.length(2);
    // Six own delegates in the reserve
    expect(wrapper.findAll('.turmoil-board-tab__corner--right img')).has.length(4);
    expect(wrapper.find('.turmoil-board-tab__more').text()).eq('+2');
  });

  it('outlines the party picked in the delegate tab', async () => {
    const wrapper = mount(TurmoilBoard, {...globalConfig, props: {turmoil: fakeTurmoil(), players, viewerColor: 'red', generation: 3}});
    expect(wrapper.find('.turmoil-board-tab__pick').exists()).is.false;
    turmoilPickState.pick = PartyName.UNITY;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.turmoil-board-tab__pick').exists()).is.true;
  });
});
