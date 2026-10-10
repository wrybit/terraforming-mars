import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {computed} from 'vue';
import {globalConfig} from '../getLocalVue';
import {sampleGames} from './statsFixtures';
import {allPlayerResults, playerColors, playerNames} from '@/client/components/stats/statsResults';
import StatsTable from '@/client/components/stats/StatsTable.vue';
import StatsEntityList from '@/client/components/stats/StatsEntityList.vue';
import StatsEntityDetail from '@/client/components/stats/StatsEntityDetail.vue';
import StatsOverview from '@/client/components/stats/StatsOverview.vue';
import StatsPlayersView from '@/client/components/stats/StatsPlayersView.vue';
import StatsRecordsView from '@/client/components/stats/StatsRecordsView.vue';
import StatsGameList from '@/client/components/stats/StatsGameList.vue';
import StatsGamesView from '@/client/components/stats/StatsGamesView.vue';
import StatsWinRate from '@/client/components/stats/StatsWinRate.vue';
import StatsKpis from '@/client/components/stats/StatsKpis.vue';
import StatsLineChart from '@/client/components/stats/StatsLineChart.vue';
import StatsBarChart from '@/client/components/stats/StatsBarChart.vue';
import StatsEntityName from '@/client/components/stats/StatsEntityName.vue';
import StatsPointSources from '@/client/components/stats/StatsPointSources.vue';
import {CardName} from '@/common/cards/CardName';
import StatsShowcase from '@/client/components/stats/StatsShowcase.vue';
import StatsEntityAsset from '@/client/components/stats/StatsEntityAsset.vue';
import StatsBoardPreview from '@/client/components/stats/StatsBoardPreview.vue';
import {aggregate} from '@/client/components/stats/statsAggregate';
import {flushPromises} from '@vue/test-utils';
import {BoardName} from '@/common/boards/BoardName';
import StatsCardZoom from '@/client/components/stats/StatsCardZoom.vue';
import {CARD_ZOOM_KEY, StatsCardZoomRequest} from '@/client/components/stats/statsCardZoom';

const games = sampleGames();
const results = allPlayerResults(games);
const config = {
  global: {
    ...globalConfig.global,
    provide: {playerColors: computed(() => playerColors(games))},
  },
};

describe('Stats components', () => {
  it('StatsTable sorts by the clicked column', async () => {
    const wrapper = mount(StatsTable, {
      ...config,
      props: {
        columns: [{key: 'name', label: 'Name', value: (row: {name: string}) => row.name, text: true}, {key: 'value', label: 'Value', value: (row: {value: number}) => row.value}],
        rows: [{name: 'A', value: 1}, {name: 'B', value: 3}, {name: 'C', value: 2}],
        rowKey: (row: {name: string}) => row.name,
        initialSort: 'value',
      },
    });
    const firstColumn = () => wrapper.findAll('tbody tr').map((row) => row.find('td').text());
    expect(firstColumn()).deep.eq(['B', 'C', 'A']);
    await wrapper.findAll('th')[0].trigger('click');
    expect(firstColumn()).deep.eq(['A', 'B', 'C']);
  });

  it('StatsEntityList links every corporation to its detail page', () => {
    const wrapper = mount(StatsEntityList, {...config, props: {kind: 'corporation', results}});
    const links = wrapper.findAll('a[data-stats-link]').map((link) => link.attributes('href'));
    expect(links).to.include('stats?kind=corporation&name=Ecoline');
  });

  it('StatsEntityList shows funder wins for awards and games for boards', () => {
    expect(mount(StatsEntityList, {...config, props: {kind: 'award', results}}).text()).to.include('Landlord');
    expect(mount(StatsEntityList, {...config, props: {kind: 'board', results}}).text()).to.include('Hellas');
  });

  it('StatsEntityDetail shows companions and games', () => {
    const wrapper = mount(StatsEntityDetail, {...config, props: {kind: 'corporation', name: 'Ecoline', results}});
    expect(wrapper.text()).to.include('Birds');
    expect(wrapper.findAll('.stats-games tbody tr')).has.length(3);
  });

  it('StatsEntityDetail for a player shows head to head', () => {
    const wrapper = mount(StatsEntityDetail, {...config, props: {kind: 'player', name: 'Jens', results}});
    expect(wrapper.text()).to.include('Head to head');
  });

  it('overview, players, records and small parts mount', () => {
    expect(mount(StatsOverview, {...config, props: {games, results, chartWidth: 640}}).findAll('.stats-win')).has.length(5);
    expect(mount(StatsPlayersView, {...config, props: {results, names: playerNames(games)}}).findAll('.stats-player-card')).has.length(3);
    expect(mount(StatsRecordsView, {...config, props: {results}}).text()).to.include('120');
    expect(mount(StatsGameList, {...config, props: {games}}).findAll('tbody tr')).has.length(3);
    expect(mount(StatsWinRate, {...config, props: {winRate: 0.5, expected: 0.33}}).text()).to.include('50 %');
    expect(mount(StatsKpis, {...config, props: {tiles: [{label: 'Games', value: 3}]}}).text()).to.include('3');
    expect(mount(StatsLineChart, {...config, props: {series: [{name: 'Jens', color: 'blue', points: [{value: 1}, {value: 3, highlight: true}, {value: undefined}]}], labels: ['1', '2', '3']}}).findAll('circle')).has.length(2);
    expect(mount(StatsPointSources, {...config, props: {results}}).findAll('tbody tr')).has.length(3);
    expect(mount(StatsBarChart, {...config, props: {bars: [{label: '9', value: 1}]}}).findAll('rect')).has.length(1);
    expect(mount(StatsEntityName, {...config, props: {kind: 'player', name: 'Martin'}}).classes()).to.include('player_translucent_bg_color_green');
  });

  it('card names open the card zoom with their neighbours', async () => {
    const requests: Array<StatsCardZoomRequest> = [];
    const wrapper = mount(StatsEntityName, {
      global: {...config.global, provide: {...config.global.provide, [CARD_ZOOM_KEY]: (request: StatsCardZoomRequest) => requests.push(request)}},
      props: {kind: 'card', name: 'Birds', siblings: ['Ants', 'Birds']},
    });
    await wrapper.find('.stats-card-button').trigger('click');
    expect(requests.map((request) => [request.names, request.index])).deep.eq([[['Ants', 'Birds'], 1]]);
    expect(mount(StatsEntityName, {...config, props: {kind: 'milestone', name: 'Mayor'}}).find('.stats-card-button').exists()).is.false;
  });

  it('StatsCardZoom shows the cards', () => {
    const wrapper = mount(StatsCardZoom, {...config, props: {names: [CardName.ANTS, CardName.BIRDS], index: 1}, attachTo: document.body});
    expect(document.body.querySelectorAll('.mb-card-zoom-slide .card-container').length).eq(2);
    wrapper.unmount();
  });

  it('shows game material: cards, milestone and award tiles, boards', async () => {
    expect(mount(StatsShowcase, {...config, props: {kind: 'corporation', entries: aggregate(results, 'corporation')}}).findAll('.card-container')).has.length(2);
    expect(mount(StatsEntityAsset, {...config, props: {kind: 'milestone', name: 'Gardener'}}).find('.milestones').exists()).is.true;
    expect(mount(StatsEntityAsset, {...config, props: {kind: 'award', name: 'Landlord'}}).find('.awards').exists()).is.true;
    const originalFetch = global.fetch;
    global.fetch = () => Promise.resolve({ok: true, json: () => Promise.resolve([])} as unknown as Response);
    const board = mount(StatsBoardPreview, {...config, props: {boardKey: BoardName.THARSIS}});
    await flushPromises();
    expect(board.find('.stats-note').exists()).is.false;
    global.fetch = originalFetch;
  });

  it('StatsGamesView lists every game, newest first', () => {
    const wrapper = mount(StatsGamesView, {...config, props: {games}});
    expect(wrapper.findAll('tbody tr')).has.length(games.length);
    expect(wrapper.find('h2').text()).contains(String(games.length));
  });

  it('StatsGameList sorts by the clicked column, the result link column stays put', async () => {
    const wrapper = mount(StatsGameList, {...config, props: {games}});
    const generations = () => wrapper.findAll('tbody tr').map((row) => row.findAll('td')[2].text());
    const headers = wrapper.findAll('th');
    await headers[2].trigger('click');
    expect(generations()).deep.eq(['12', '11', '9']);
    await headers[2].trigger('click');
    expect(generations()).deep.eq(['9', '11', '12']);
    await headers[5].trigger('click');
    expect(generations()).deep.eq(['9', '11', '12']);
    expect(headers[5].classes()).to.include('stats-table-unsortable');
  });

  it('StatsGameList shows the setup of each game as chips', () => {
    const wrapper = mount(StatsGameList, {...config, props: {games}});
    const chipTexts = (row: number) => wrapper.findAll('tbody tr')[row].findAll('.create-game-summary-chip').map((chip) => chip.text());
    // Newest first: the screenshot game without details only knows its players
    expect(chipTexts(0)).deep.eq(['3 players']);
    expect(chipTexts(1)).deep.eq(['2 players', 'Hellas', 'Base game', 'Corporate Era', 'Prelude']);
    // The board chip links to the board's statistics page
    expect(wrapper.findAll('tbody tr')[1].find('a.create-game-summary-chip').attributes('href')).contains('hellas');
  });
});
