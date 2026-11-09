import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import AdminPlayers from '@/client/components/admin/AdminPlayers.vue';
import {AdminPlayerAliasesInfo} from '@/common/admin/PlayerAliases';
import {statsGame} from './playerFixtures';

describe('AdminPlayers', () => {
  let originalFetch: typeof global.fetch;
  let posted: Array<unknown>;
  const info: AdminPlayerAliasesInfo = {aliases: [{id: 'a1', from: 'Michael', to: 'Micha', createdTimeMs: 0}], defaultNames: ['Blue', 'Blau'], appearances: [{name: 'Micha', emoji: '🚀'}]};
  const games = [statsGame(1, [{name: 'Jens'}, {name: 'jens'}, {name: 'Micha'}]), statsGame(2, [{name: 'Jens'}, {name: 'Blue'}])];

  async function settle(): Promise<void> {
    for (let i = 0; i < 6; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  beforeEach(() => {
    posted = [];
    originalFetch = global.fetch;
    global.fetch = (url, init) => {
      if (init?.method === 'POST') {
        posted.push(JSON.parse(String(init.body)));
      }
      const path = new URL(String(url), window.location.origin).pathname;
      const body = path === '/api/stats/games' ? games : path === '/api/admin/player-aliases' ? info : {admin: true};
      return Promise.resolve({ok: true, status: 200, json: () => Promise.resolve(body)} as Response);
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('lists the names, the saved merges and proposes duplicates', async () => {
    const wrapper = mount(AdminPlayers, {...globalConfig});
    await settle();
    expect(wrapper.findAll('.admin-players-row .admin-players-who b').map((name) => name.text())).deep.eq(['Jens', 'Blue', 'jens', 'Micha']);
    expect(wrapper.find('.admin-players-old').text()).contains('Michael');
    expect(wrapper.findAll('.admin-players-alias')).has.length(1);
    expect(wrapper.findAll('.admin-players-suggestion')).has.length(1);
  });

  it('tapping two names asks first, strikes the dropped name and merges on confirm', async () => {
    const wrapper = mount(AdminPlayers, {...globalConfig, attachTo: document.body});
    await settle();
    const rows = wrapper.findAll('.admin-players-row');
    await rows[2].trigger('click');
    await rows[0].trigger('click');
    expect(wrapper.find('.admin-players-side--goes s').text()).eq('jens');
    expect(wrapper.find('.admin-players-side--stays strong').text()).eq('Jens');
    // Both played in the same game: the dialog warns
    expect(wrapper.find('.admin-players-dialog-warning').exists()).is.true;
    await wrapper.find('.admin-players-dialog-actions .btn-primary').trigger('click');
    await settle();
    expect(posted).deep.eq([{action: 'merge', from: 'jens', to: 'Jens', permanent: true}]);
    wrapper.unmount();
  });

  it('swap turns the direction around', async () => {
    const wrapper = mount(AdminPlayers, {...globalConfig, attachTo: document.body});
    await settle();
    await wrapper.find('.admin-players-suggestion .btn').trigger('click');
    await wrapper.findAll('.admin-players-dialog-actions .btn')[0].trigger('click');
    await settle();
    expect(wrapper.find('.admin-players-side--stays strong').text()).eq('jens');
    wrapper.unmount();
  });

  it('a default name merges one-time unless switched on', async () => {
    const wrapper = mount(AdminPlayers, {...globalConfig, attachTo: document.body});
    await settle();
    const rows = wrapper.findAll('.admin-players-row');
    expect(rows[1].find('.admin-players-default-tag').exists()).is.true;
    await rows[1].trigger('click');
    await rows[0].trigger('click');
    expect((wrapper.find('.admin-players-dialog .toggle-switch-input').element as HTMLInputElement).checked).is.false;
    await wrapper.find('.admin-players-dialog-actions .btn-primary').trigger('click');
    await settle();
    expect(posted).deep.eq([{action: 'merge', from: 'Blue', to: 'Jens', permanent: false}]);
    wrapper.unmount();
  });
});
