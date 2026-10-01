import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ImportGameForm from '@/client/components/admin/ImportGameForm.vue';

describe('ImportGameForm', () => {
  let originalFetch: typeof global.fetch;
  let requests: Array<{url: string, body: string}>;

  beforeEach(() => {
    originalFetch = global.fetch;
    requests = [];
    global.fetch = (url, init) => {
      requests.push({url: String(url), body: String(init?.body)});
      return Promise.resolve({ok: true, json: () => Promise.resolve({players: [{name: 'Jens'}]})} as Response);
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends the link and reports the import', async () => {
    const wrapper = mount(ImportGameForm, {...globalConfig, props: {serverId: 'secret'}});
    await wrapper.find('input').setValue('https://terraforming-mars.herokuapp.com/the-end?id=p66b9daab6513');
    await wrapper.find('form').trigger('submit');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(requests).deep.eq([{url: 'api/admin/import-game?serverId=secret', body: '{"url":"https://terraforming-mars.herokuapp.com/the-end?id=p66b9daab6513"}'}]);
    expect(wrapper.emitted('imported')).has.length(1);
    expect(wrapper.text()).contains('Imported: Jens');
  });
});
