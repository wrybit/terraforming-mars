import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import PlayerNameList from '@/client/components/admin/players/PlayerNameList.vue';
import {PlayerNameStats} from '@/client/components/admin/players/playerNameStats';

const player = (name: string, games: number, lastTimeMs: number): PlayerNameStats => ({name, games, lastTimeMs, color: 'red', wins: 0, oldNames: [], isBot: false});

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

  it('AI accounts can neither be selected nor be a target', async () => {
    const bot: PlayerNameStats = {...player('Bot [AI+]', 4, 4), isBot: true};
    const wrapper = mount(PlayerNameList, {...globalConfig, props: {players: [player('Jens', 9, 1), bot], defaultNames: []}});
    const rows = wrapper.findAll('.admin-players-row');
    // AI group on top: rows[0] is the bot, rows[1] the human
    expect(rows[0].attributes('draggable')).eq('false');
    await rows[0].trigger('click');
    expect(wrapper.find('.admin-players-hint').exists()).is.false;
    await rows[1].trigger('click');
    await rows[0].trigger('click');
    expect(wrapper.emitted('merge')).is.undefined;
  });

  it('shows the AI accounts as their own group on top, in strength order', () => {
    const bot = (name: string, games: number): PlayerNameStats => ({...player(name, games, 0), isBot: true});
    const wrapper = mount(PlayerNameList, {...globalConfig, props: {players: [player('Jens', 9, 1), bot('Bot [AI+]', 8), bot('Bot [AI-]', 7), bot('Bot [AI]', 1)], defaultNames: []}});
    const groups = wrapper.findAll('.admin-players-group');
    expect(groups.map((group) => group.find('.admin-players-group-title').text())).deep.eq(['AI 3', 'Players 1']);
    expect(groups[0].findAll('.admin-players-who b').map((name) => name.text())).deep.eq(['Bot [AI-]', 'Bot [AI]', 'Bot [AI+]']);
  });
});
