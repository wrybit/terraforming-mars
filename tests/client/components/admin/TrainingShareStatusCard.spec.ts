import {flushPromises, mount} from '@vue/test-utils';
import {expect} from 'chai';
import {vi} from 'vitest';
import {globalConfig} from '../getLocalVue';
import TrainingShareStatusCard from '@/client/components/admin/TrainingShareStatusCard.vue';
import {TrainingShareStatus} from '@/common/trainingShare/TrainingShareModel';

function status(change: Partial<TrainingShareStatus>): TrainingShareStatus {
  return {mode: 'auto', anonymous: true, serverKeyStart: '1a2b3c4d', sharedGameIds: ['g1', 'g2'], pendingGameIds: [], lastSharedAtMs: 1_795_000_000_000, lastError: undefined, ...change};
}

async function mountWith(value: TrainingShareStatus) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(value), {status: 200})));
  const wrapper = mount(TrainingShareStatusCard, globalConfig);
  await flushPromises();
  return wrapper;
}

describe('TrainingShareStatusCard', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows how many games were shared and the start of the server key', async () => {
    const wrapper = await mountWith(status({}));
    expect(wrapper.find('.training-share-facts').text()).to.include('2');
    expect(wrapper.find('code').text()).eq('1a2b3c4d…');
    expect(wrapper.find('.training-share-problem').exists()).is.false;
  });

  it('names the last problem with game and reason', async () => {
    const wrapper = await mountWith(status({lastError: {gameId: 'g9', message: 'offline', atMs: 1_795_000_000_000}}));
    const problem = wrapper.find('.training-share-problem').text();
    expect(problem).to.include('g9');
    expect(problem).to.include('offline');
  });

  it('stays hidden while sharing is off', async () => {
    const wrapper = await mountWith(status({mode: 'off'}));
    expect(wrapper.find('.training-share-status').exists()).is.false;
  });
});
