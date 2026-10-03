import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import WaitingForPlayersTab from '@/client/components/WaitingForPlayersTab.vue';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {Phase} from '@/common/Phase';
import {asComplete} from './utils/models';

function view(phase: Phase): PlayerViewModel {
  const me = asComplete<PublicPlayerModel>({color: 'blue', name: 'Jens', isActive: false, needsToDraft: false});
  const daniel = asComplete<PublicPlayerModel>({color: 'red', name: 'Daniel', isActive: true, needsToDraft: true});
  return asComplete<PlayerViewModel>({game: {phase} as PlayerViewModel['game'], thisPlayer: me, players: [me, daniel]});
}

describe('WaitingForPlayersTab', () => {
  it('names whose turn it is in the action phase', () => {
    const wrapper = mount(WaitingForPlayersTab, {...globalConfig, props: {playerView: view(Phase.ACTION)}});
    expect(wrapper.text()).contains('Daniel');
    expect(wrapper.text()).contains('is taking their turn');
  });

  it('says whom we are waiting for in the draft', () => {
    const wrapper = mount(WaitingForPlayersTab, {...globalConfig, props: {playerView: view(Phase.DRAFTING)}});
    expect(wrapper.text()).contains('Waiting for other players');
    expect(wrapper.text()).contains('Daniel');
    expect(wrapper.text()).not.contains('taking their turn');
  });
});
