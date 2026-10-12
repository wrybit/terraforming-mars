import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import AdminRaw from '@/client/components/admin/AdminRaw.vue';
import {formatRawData} from '@/client/components/admin/RawDataCard.vue';

describe('AdminRaw', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    // Logged in (api/admin/session), then the raw data
    global.fetch = (url) => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({admin: true}),
      text: () => Promise.resolve(String(url) === 'api/metrics' ? 'metric 1' : '{"a":1}'),
    } as Response);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows every raw data source as a card below each other', async () => {
    const wrapper = mount(AdminRaw, {...globalConfig});
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    const cards = wrapper.findAll('.raw-data-card');
    expect(cards).has.length(5);
    expect(wrapper.findAll('.raw-data-content').map((pre) => pre.text())).deep.eq(['{\n  "a": 1\n}', '{\n  "a": 1\n}', '{\n  "a": 1\n}', 'metric 1']);
  });

  it('indents JSON and keeps other text', () => {
    expect(formatRawData('{"a":[1]}', 'json')).eq('{\n  "a": [\n    1\n  ]\n}');
    expect(formatRawData('not json', 'json')).eq('not json');
    expect(formatRawData('{"a":1}', 'text')).eq('{"a":1}');
  });
});
