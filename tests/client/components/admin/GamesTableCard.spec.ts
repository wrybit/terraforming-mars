import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import GamesTableCard from '@/client/components/admin/GamesTableCard.vue';
import {PLAYER_COLUMNS} from '@/client/components/admin/playerColumns';

describe('GamesTableCard', () => {
  it('shows the group title with the number of games', () => {
    const wrapper = shallowMount(GamesTableCard, {
      ...globalConfig,
      props: {groupKey: 'open', title: 'Open games', games: [], columns: PLAYER_COLUMNS, deletingIds: []},
    });
    expect(wrapper.find('h2').text()).contains('Open games');
    expect(wrapper.find('h2').text()).contains('0 games');
  });
});
