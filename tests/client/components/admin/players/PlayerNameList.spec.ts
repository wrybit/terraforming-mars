import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import PlayerNameList from '@/client/components/admin/players/PlayerNameList.vue';
import {PlayerNameStats} from '@/client/components/admin/players/playerNameStats';

const player = (name: string, games: number, lastTimeMs: number): PlayerNameStats => ({name, games, lastTimeMs, color: 'red', wins: 0, oldNames: []});

describe('PlayerNameList', () => {
  const players = [player('Jens', 9, 1), player('Anna', 4, 3)];
  const names = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('.admin-players-who b').map((name) => name.text());

  it('filters and sorts', async () => {
    const wrapper = mount(PlayerNameList, {...globalConfig, props: {players, defaultNames: []}});
    await wrapper.findAll('.admin-players-sort button')[1].trigger('click');
    expect(names(wrapper)).deep.eq(['Anna', 'Jens']);
    await wrapper.find('.admin-players-search').setValue('je');
    expect(names(wrapper)).deep.eq(['Jens']);
  });

  it('a second tap on the same name drops the selection', async () => {
    const wrapper = mount(PlayerNameList, {...globalConfig, props: {players, defaultNames: []}});
    const row = wrapper.find('.admin-players-row');
    await row.trigger('click');
    expect(wrapper.find('.admin-players-hint').exists()).is.true;
    await row.trigger('click');
    expect(wrapper.find('.admin-players-hint').exists()).is.false;
    expect(wrapper.emitted('merge')).is.undefined;
  });
});
