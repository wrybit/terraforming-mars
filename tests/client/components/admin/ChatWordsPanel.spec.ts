import {flushPromises, mount} from '@vue/test-utils';
import {expect} from 'chai';
import {vi} from 'vitest';
import {globalConfig} from '../getLocalVue';
import ChatWordsPanel from '@/client/components/admin/ChatWordsPanel.vue';
import {ALL_LANGUAGES} from '@/common/constants';

function lists(words: Record<string, Array<string>>) {
  return Object.fromEntries(ALL_LANGUAGES.map((language) => [language, words[language] ?? []]));
}

describe('ChatWordsPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows one column with flag per language and saves the lists per language', async () => {
    const requests: Array<Parameters<typeof fetch>[1]> = [];
    const model = {words: lists({de: ['arsch'], fr: ['salope']}), defaults: lists({de: ['arsch']})};
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: Parameters<typeof fetch>[1]) => {
      requests.push(init);
      return new Response(JSON.stringify(model), {status: 200});
    }));
    const wrapper = mount(ChatWordsPanel, {...globalConfig});
    await flushPromises();
    const columns = wrapper.findAll('.chat-words-column');
    expect(columns).has.length(ALL_LANGUAGES.length);
    expect(columns[1].find('.language-flag').attributes('src')).contains('flags/de.svg');
    expect(columns[1].find('.chat-words-count').text()).eq('1');
    await columns[1].find('textarea').setValue('arsch\nneu');
    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();
    expect(JSON.parse(String(requests[1]?.body)).words.de).deep.eq(['arsch', 'neu']);
    wrapper.unmount();
  });
});
