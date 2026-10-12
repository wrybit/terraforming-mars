import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import GameHome from '@/client/components/GameHome.vue';
import {fakeGameOptionsModel} from './testHelpers';
import {Phase} from '@/common/Phase';
import {SimpleGameModel} from '@/common/models/SimpleGameModel';
import {asComplete} from './utils/models';

describe('GameHome', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(GameHome, {
      ...globalConfig,
      props: {
        game: asComplete<SimpleGameModel>({
          activePlayer: 'blue',
          id: 'game-id-123',
          phase: Phase.ACTION,
          players: [{color: 'blue', id: 'p-blue', name: 'Blue'}],
          spectatorId: 'spectator-id-123',
          gameOptions: fakeGameOptionsModel(),
          lastSoloGeneration: 14,
          expectedPurgeTimeMs: 0,
        }),
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('offers only watching for AI players', () => {
    const wrapper = shallowMount(GameHome, {
      ...globalConfig,
      props: {
        game: asComplete<SimpleGameModel>({
          activePlayer: 'blue',
          id: 'game-id-123',
          phase: Phase.ACTION,
          players: [{color: 'blue', id: 'p-blue', name: 'Blue'}, {color: 'orange', id: 'p-orange', name: 'Bot', aiLevel: 'normal'}],
          spectatorId: 'spectator-id-123',
          gameOptions: fakeGameOptionsModel(),
          lastSoloGeneration: 14,
          expectedPurgeTimeMs: 0,
        }),
      },
    });
    // Playing is the main action; watching (AI player, spectator) is the quiet secondary button
    const links = wrapper.findAll('a.btn');
    expect(links.map((link) => link.text())).deep.eq(['Play', 'Watch', 'Watch']);
    expect(links.map((link) => link.classes('btn-primary'))).deep.eq([true, false, false]);
    expect(links.map((link) => link.classes('btn-tone-quiet'))).deep.eq([false, true, true]);
  });
});
