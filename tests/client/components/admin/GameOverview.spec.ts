import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import GameOverview from '@/client/components/admin/GameOverview.vue';
import {AdminGameSummary} from '@/common/admin/AdminGameSummary';

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
      props: {summary, columns: ['Jens', 'Martin', 'Daniel']},
    });
  }

  it('one cell per column, empty where the player did not play', () => {
    const cells = mountRow().findAll('td').map((cell) => cell.text());
    // Status, Spiel, Generation, Zuschauer, Jens, Martin, Daniel, Löschen
    expect(cells.slice(4, 7)).deep.eq(['🏆76', '', '66']);
  });

  it('corporation and win in the tooltip', () => {
    expect(mountRow().findAll('.games-overview-chip[title]').map((chip) => chip.attributes('title'))).contains('Helion · Winner');
  });

  it('an imported game links to the result page saved here, not to the other server', () => {
    const imported = {...summary, source: 'imported' as const, externalUrl: 'https://terraforming-mars.herokuapp.com/the-end?id=p66b9daab6513', importedParticipantId: 'p66b9daab6513'};
    const wrapper = mount(GameOverview, {...globalConfig, attachTo: document.createElement('tbody'), props: {summary: imported, columns: ['Jens']}});
    expect(wrapper.find('.games-overview-source').attributes('href')).eq('the-end?id=p66b9daab6513');
  });

  it('delete needs a second click', async () => {
    const wrapper = mountRow();
    const button = wrapper.find('.games-overview-delete');
    await button.trigger('click');
    expect(wrapper.emitted('delete')).is.undefined;
    expect(button.text()).eq('Really delete?');
    await button.trigger('click');
    expect(wrapper.emitted('delete')).deep.eq([['g123']]);
  });
});
