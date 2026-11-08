import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import PlayerMergeDialog from '@/client/components/admin/players/PlayerMergeDialog.vue';
import {PlayerNameStats} from '@/client/components/admin/players/playerNameStats';

const player = (name: string, games: number): PlayerNameStats => ({name, games, color: 'red', wins: 0, lastTimeMs: 0, oldNames: []});

describe('PlayerMergeDialog', () => {
  it('shows the new game count of the name that stays, warns only for shared games', () => {
    const wrapper = mount(PlayerMergeDialog, {...globalConfig, attachTo: document.body, props: {from: player('jens', 3), to: player('Jens', 10), sharedGames: 0, busy: false}});
    expect(wrapper.find('.admin-players-side--stays .admin-players-side-count').text()).contains('10 → 13');
    expect(wrapper.find('.admin-players-dialog-warning').exists()).is.false;
    wrapper.unmount();
  });
});
