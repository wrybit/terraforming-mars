import {flushPromises, mount, shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import {fakePlayerViewModel} from '../testHelpers';
import ReplayButton from '@/client/components/replay/ReplayButton.vue';
import ReplayPanel from '@/client/components/replay/ReplayPanel.vue';
import ReplayTimeline from '@/client/components/replay/ReplayTimeline.vue';
import ReplayView from '@/client/components/replay/ReplayView.vue';
import {reconstructReplay} from '@/client/components/replay/reconstructReplay';
import {replaySteps} from '@/client/components/replay/replaySteps';
import {ReplaySourceModel} from '@/common/models/ReplaySourceModel';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {ParticipantId} from '@/common/Types';

// Smallest real game: two players, one generation, both pass
const source: ReplaySourceModel = {
  players: ['red', 'blue'].map((color) => ({
    color: color as 'red' | 'blue', name: color, startTerraformRating: 20, dealtProjectCards: [],
    endResources: {megacredits: 0, steel: 0, titanium: 0, plants: 0, energy: 0, heat: 0}, endHand: [],
  })),
  startTemperature: -30, startOxygenLevel: 0, endTiles: [],
  log: [
    {message: 'Generation ${0}', data: [{type: LogMessageDataType.RAW_STRING, value: '1'}]},
    {message: '${0} passed', data: [{type: LogMessageDataType.PLAYER, value: 'red'}]},
    {message: '${0} passed', data: [{type: LogMessageDataType.PLAYER, value: 'blue'}]},
  ],
};

const panelProps = {
  count: 3, current: 0, generations: [{number: 1, start: 0, count: 3}], raises: [],
  marks: [{step: 1, kind: 'milestone' as const, name: 'Terraformer', color: 'red' as const}],
  terraformRatings: [{color: 'red' as const, values: [20, 20, 21]}, {color: 'blue' as const, values: [20, 20, 20]}],
  players: [{color: 'red' as const, name: 'red'}, {color: 'blue' as const, name: 'blue'}],
  perspective: 'red' as const, eventText: 'red passed', actor: 'red' as const, temperature: -30, oxygen: 0, oceans: 0,
};

describe('ReplayButton', () => {
  let originalFetch: typeof global.fetch;
  beforeEach(() => {
    originalFetch = global.fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows a spinner while loading and opens the reconstructed replay', async () => {
    global.fetch = () => Promise.resolve({ok: true, status: 200, json: () => Promise.resolve(source)} as Response);
    const wrapper = mount(ReplayButton, {...globalConfig, props: {participantId: 'p123' as ParticipantId, gameId: 'g1'}});
    await wrapper.find('button').trigger('click');
    expect(wrapper.find('.replay-button__spinner').exists()).is.true;
    await new Promise((resolve) => setTimeout(resolve, 5));
    await flushPromises();
    const opened = wrapper.emitted('open');
    expect(opened).has.length(1);
    expect((opened![0][0] as any).states.length).eq(source.log.length);
    expect(wrapper.find('.replay-button__spinner').exists()).is.false;
  });

  it('names the game when its start is missing', async () => {
    global.fetch = () => Promise.resolve({ok: false, status: 404} as Response);
    const wrapper = mount(ReplayButton, {...globalConfig, props: {participantId: 'p123' as ParticipantId, gameId: 'g1'}});
    await wrapper.find('button').trigger('click');
    await flushPromises();
    expect(wrapper.find('.replay-button__error').text()).contains('g1');
    expect(wrapper.emitted('open')).is.undefined;
  });
});

describe('ReplayTimeline', () => {
  it('draws one TR line per player and jumps to a milestone', async () => {
    const {count, current, generations, raises, marks, terraformRatings} = panelProps;
    const wrapper = mount(ReplayTimeline, {
      ...globalConfig,
      props: {count, current, generations, raises, marks, terraformRatings, playerNames: {red: 'red', blue: 'blue'}, thin: false},
    });
    expect(wrapper.findAll('polyline').length).eq(4);
    await wrapper.find('.replay-timeline__mark').trigger('click');
    expect(wrapper.emitted('go')?.[0]).deep.eq([1]);
  });
});

describe('ReplayPanel', () => {
  it('steps forward, changes perspective and closes', async () => {
    const wrapper = mount(ReplayPanel, {...globalConfig, props: panelProps});
    await wrapper.find('[aria-label="Step forward"]').trigger('click');
    expect(wrapper.emitted('go')?.[0]).deep.eq([1]);
    await wrapper.find('[aria-label="Close replay"]').trigger('click');
    expect(wrapper.emitted('close')).has.length(1);
  });
});

describe('ReplayView', () => {
  it('mounts with a reconstructed game', () => {
    const states = reconstructReplay(source);
    const wrapper = shallowMount(ReplayView, {
      ...globalConfig,
      props: {final: fakePlayerViewModel(), source, states, steps: replaySteps(source, states)},
    });
    expect(wrapper.find('.replay-view').exists()).is.true;
  });
});
