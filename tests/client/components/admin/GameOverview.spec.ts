import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import GameOverview from '@/client/components/admin/GameOverview.vue';
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';
import {PLAYER_COLUMNS} from '@/client/components/admin/playerColumns';

describe('GameOverview', () => {
  const summary: AdminGameSummary = {
    id: 'g123',
    source: 'local',
    createdTimeMs: 0,
    isFinished: true,
    generation: 10,
    spectatorUrl: 'spectator?id=s1',
    externalUrl: undefined,
    importedParticipantId: undefined,
    screenshotUrl: undefined,
    players: [
      {name: 'Jens', color: 'blue', url: 'player?id=p1', victoryPoints: 76, megaCredits: 0, isWinner: true, corporation: 'Helion'},
      {name: 'Daniel', color: 'red', url: 'player?id=p2', victoryPoints: 66, megaCredits: 0, isWinner: false, corporation: undefined},
    ],
  };

  function mountRow() {
    return mount(GameOverview, {
      ...globalConfig,
      attachTo: document.createElement('tbody'),
      props: {summary, columns: PLAYER_COLUMNS},
    });
  }

  it('theme: Mars planet for games without a theme, Arrakis for Dune games', () => {
    const mars = mountRow().get('[data-test=game-theme]');
    expect(mars.text()).eq('Mars');
    expect(mars.attributes('style')).contains('mars-planet.png');
    const dune = mount(GameOverview, {...globalConfig, attachTo: document.createElement('tbody'), props: {summary: {...summary, theme: 'dune'}, columns: PLAYER_COLUMNS}}).get('[data-test=game-theme]');
    expect(dune.text()).eq('Dune');
    expect(dune.attributes('style')).contains('arrakis-planet.png');
  });

  it('one cell per column, empty where the player did not play', () => {
    const cells = mountRow().findAll('td').map((cell) => cell.text());
    // Theme, status, game, generation, spectators/result, players 1–6, AI 1–5, delete
    expect(cells.slice(5, 16)).deep.eq(['Jens🏆76 VP', 'Daniel66 VP', '', '', '', '', '', '', '', '', '']);
  });

  it('finished: shows the result instead of watching; running: watch as spectator', () => {
    const finished = mount(GameOverview, {...globalConfig, attachTo: document.createElement('tbody'), props: {summary: {...summary, resultUrl: 'the-end?id=p1'}, columns: PLAYER_COLUMNS}});
    expect(finished.find('.games-overview-chip--spectator').attributes('href')).eq('the-end?id=p1');
    const running = mount(GameOverview, {...globalConfig, attachTo: document.createElement('tbody'), props: {summary: {...summary, isFinished: false}, columns: PLAYER_COLUMNS}});
    expect(running.find('.games-overview-chip--spectator').attributes('href')).eq('spectator?id=s1');
  });

  it('always offers the delete button', () => {
    const wrapper = mount(GameOverview, {...globalConfig, attachTo: document.createElement('tbody'), props: {summary, columns: PLAYER_COLUMNS}});
    expect(wrapper.find('.games-overview-delete').exists()).is.true;
  });

  it('corporation and win in the tooltip', () => {
    expect(mountRow().findAll('.games-overview-chip[title]').map((chip) => chip.attributes('title'))).contains('Helion · Winner');
  });

  it('an imported game links to the result page saved here, not to the other server', () => {
    const imported = {...summary, source: 'imported' as const, externalUrl: 'https://terraforming-mars.herokuapp.com/the-end?id=p66b9daab6513', importedParticipantId: 'p66b9daab6513'};
    const wrapper = mount(GameOverview, {...globalConfig, attachTo: document.createElement('tbody'), props: {summary: imported, columns: PLAYER_COLUMNS}});
    expect(wrapper.find('.games-overview-source').attributes('href')).eq('the-end?id=p66b9daab6513');
  });

  it('delete needs a second click', async () => {
    const wrapper = mountRow();
    const button = wrapper.find('.games-overview-delete');
    await button.trigger('click');
    expect(wrapper.emitted('delete')).is.undefined;
    expect(button.find('.games-overview-delete-label--active').text()).eq('Really delete?');
    await button.trigger('click');
    expect(wrapper.emitted('delete')).deep.eq([['g123']]);
  });

  it('the delete button carries every text from the start, so asking does not resize it', () => {
    const labels = mountRow().findAll('.games-overview-delete-label');
    expect(labels.map((label) => label.text())).deep.eq(['Delete', 'Really delete?', 'Deleting…']);
    expect(labels.filter((label) => label.classes('games-overview-delete-label--active')).map((label) => label.text())).deep.eq(['Delete']);
  });

  it('round flag of the chosen language in front of the name, language in the tooltip', () => {
    const withLanguage: AdminGameSummary = {...summary, players: [{...summary.players[0], language: 'ua'}, summary.players[1]]};
    const row = mount(GameOverview, {...globalConfig, attachTo: document.createElement('tbody'), props: {summary: withLanguage, columns: PLAYER_COLUMNS}});
    const flags = row.findAll('.language-flag--round');
    expect(flags).has.length(1);
    expect(flags[0].attributes('src')).eq('assets/flags/ua.svg');
    expect(row.find('.games-overview-players .games-overview-chip').attributes('title')).contains('Українська');
  });
});
