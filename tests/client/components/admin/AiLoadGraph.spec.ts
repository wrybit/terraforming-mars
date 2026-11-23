import {flushPromises, mount} from '@vue/test-utils';
import {expect} from 'chai';
import {vi} from 'vitest';
import {globalConfig} from '../getLocalVue';
import AiLoadGraph from '@/client/components/admin/AiLoadGraph.vue';
import {LiveLoadSample} from '@/common/admin/LiveLoad';

const SAMPLE: LiveLoadSample = {
  measuredAtMs: 1000, cores: 4, processorModel: 'Test CPU', corePercent: [10, 95, 20, 30],
  cpu: {totalPercent: 39, gameServerPercent: 5, aiPercent: 25},
  memory: {totalBytes: 8 * 1024 ** 3, availableBytes: 4 * 1024 ** 3, gameServerBytes: 1024 ** 3, aiBytes: 512 * 1024 ** 2},
  aiBots: 2,
};

describe('AiLoadGraph', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the processor parts, one bar per core and the memory, and reports the cores', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(SAMPLE), {status: 200})));
    const wrapper = mount(AiLoadGraph, {...globalConfig});
    await flushPromises();
    expect(wrapper.findAll('.ai-load-area')).has.length(3);
    expect(wrapper.findAll('.ai-load-core')).has.length(4);
    expect(wrapper.findAll('.ai-load-core-fill--full')).has.length(1);
    expect(wrapper.find('.ai-load-machine').text()).contains('Test CPU');
    expect(wrapper.find('.ai-load-legend').text()).contains('25 %');
    expect(wrapper.emitted('measured')?.[0]).deep.eq([SAMPLE]);
    wrapper.unmount();
  });

  it('names the failure when the server does not answer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', {status: 500})));
    const wrapper = mount(AiLoadGraph, {...globalConfig});
    await flushPromises();
    expect(wrapper.find('.ai-load-failure').exists()).is.true;
    wrapper.unmount();
  });
});
