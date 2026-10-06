import {shallowMount, flushPromises} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CreateGameBoardPreview from '@/client/components/create/CreateGameBoardPreview.vue';
import {BoardName} from '@/common/boards/BoardName';
import {NewGameConfig} from '@/common/game/NewGameConfig';

describe('CreateGameBoardPreview', () => {
  const originalFetch = window.fetch;
  afterEach(() => {
    window.fetch = originalFetch;
  });

  it('shows the board the server builds and reports the drawn board', async () => {
    let body = '';
    window.fetch = (async (_url: string, init: {body: string}) => {
      body = String(init.body);
      return new Response(JSON.stringify({boardName: BoardName.HELLAS, spaces: []}));
    }) as typeof fetch;
    const config = {board: 'random official', boardSeed: 0.4, expansions: {}} as unknown as NewGameConfig;
    const wrapper = shallowMount(CreateGameBoardPreview, {
      ...globalConfig,
      props: {config, isRandom: true, showBoardName: true, boardColorClass: () => ''},
    });
    await flushPromises();
    expect(JSON.parse(body).boardSeed).eq(0.4);
    expect(wrapper.emitted('drawn')).deep.eq([[BoardName.HELLAS]]);
    expect(wrapper.text()).contains(BoardName.HELLAS);
  });
});
