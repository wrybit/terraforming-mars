import {flushPromises, mount, shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import {fakePlayerViewModel} from '../testHelpers';
import ReplayButton from '@/client/components/replay/ReplayButton.vue';
import ReplayPanel from '@/client/components/replay/ReplayPanel.vue';
import ReplayMobileHome from '@/client/components/replay/ReplayMobileHome.vue';
import ReplayPlayButton from '@/client/components/replay/ReplayPlayButton.vue';
import ReplaySpeedBars from '@/client/components/replay/ReplaySpeedBars.vue';
import {REPLAY_DEFAULT_SPEED, replayRemaining, replaySeconds} from '@/client/components/replay/replaySpeed';
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
  victoryPoints: [{color: 'red' as const, values: [20, 20, 21]}, {color: 'blue' as const, values: [20, 20, 20]}],
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
    const {count, current, generations, raises, marks, victoryPoints} = panelProps;
    const wrapper = mount(ReplayTimeline, {
      ...globalConfig,
      props: {count, current, generations, raises, marks, victoryPoints, playerNames: {red: 'red', blue: 'blue'}, thin: false},
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

describe('Replay speed', () => {
  it('lights the bars up to the chosen speed and reports a click', async () => {
    const wrapper = mount(ReplaySpeedBars, {...globalConfig, props: {modelValue: 2}});
    const bars = wrapper.findAll('.replay-speed-bars__bar');
    expect(bars).has.length(5);
    expect(bars.map((bar) => bar.classes().includes('replay-speed-bars__bar--lit'))).deep.eq([true, true, true, false, false]);
    await bars[4].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).deep.eq([4]);
  });

  it('runs the countdown only while playing, within the button', () => {
    const props = {playing: false, label: 'Play', size: 48, radius: 10, stepMs: 750, runKey: 1};
    expect(mount(ReplayPlayButton, {...globalConfig, props}).find('.replay-play__run').exists()).is.false;
    const playing = mount(ReplayPlayButton, {...globalConfig, props: {...props, playing: true}});
    const run = playing.find('.replay-play__run');
    expect(run.attributes('width')).eq('45.5');
    expect(playing.find('.replay-play').attributes('style')).contains('--replay-step-ms: 750ms');
  });

  it('starts at the default speed and changes with + and −', async () => {
    const wrapper = mount(ReplayPanel, {...globalConfig, props: panelProps, attachTo: document.body});
    const lit = () => wrapper.findAll('.replay-panel__speed .replay-speed-bars__bar--lit').length;
    expect(lit()).eq(REPLAY_DEFAULT_SPEED + 1);
    window.dispatchEvent(new KeyboardEvent('keydown', {key: '+'}));
    await wrapper.vm.$nextTick();
    expect(lit()).eq(REPLAY_DEFAULT_SPEED + 2);
    window.dispatchEvent(new KeyboardEvent('keydown', {key: '-'}));
    window.dispatchEvent(new KeyboardEvent('keydown', {key: '-'}));
    await wrapper.vm.$nextTick();
    expect(lit()).eq(REPLAY_DEFAULT_SPEED);
    wrapper.unmount();
  });

  it('formats seconds and the remaining time', () => {
    expect(replaySeconds(3000)).eq((3).toLocaleString());
    expect(replayRemaining(120, 1500)).eq('3:00');
    expect(replayRemaining(-1, 1500)).eq('0:00');
  });
});

describe('ReplayPanel folding', () => {
  it('unfolds on click and folds with Escape without closing', async () => {
    const wrapper = mount(ReplayPanel, {...globalConfig, props: panelProps, attachTo: document.body});
    // The root starts with a comment: the panel is the section, not the wrapper root
    const panel = () => wrapper.find('.replay-panel').classes();
    // Unfolded at first, folded after the intro (1 s, then the fold)
    expect(panel()).not.contains('replay-panel--thin');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(panel()).contains('replay-panel--thin');
    await wrapper.find('.replay-panel__size-toggle--small').trigger('click');
    // Wide first, then tall (replayPanelMotion.ts)
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(panel()).not.contains('replay-panel--thin');
    window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    await wrapper.vm.$nextTick();
    expect(panel()).contains('replay-panel--thin');
    expect(wrapper.emitted('close')).is.undefined;
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

describe('ReplayMobileHome', () => {
  it('opens the task view before an action, never the turn sheet by itself', async () => {
    const menu = {type: 'or', title: '', buttonLabel: '', initialIdx: 0, options: [
      {type: 'card', title: 'Perform an action from a played card', buttonLabel: 'Take action', cards: [], min: 1, max: 1},
      {type: 'option', title: 'Pass for this generation', buttonLabel: 'Pass'},
    ]} as any;
    const props = {playerView: fakePlayerViewModel(), stream: [], menu, focus: undefined, eventText: '', perspective: 'red' as const,
      tileView: 'show' as const, step: 0, placed: false};
    const wrapper = shallowMount(ReplayMobileHome, {...globalConfig, props});
    await wrapper.setProps({step: 1, focus: {tab: 'Perform an action from a played card', cards: []}});
    await flushPromises();
    expect(wrapper.classes()).contains('mb-home--turn');
    expect(wrapper.findComponent({name: 'MobileTurnSheet'}).exists()).is.false;
    await wrapper.setProps({step: 2, menu: {...menu, initialIdx: 1}, focus: {tab: 'Pass for this generation', cards: []}});
    await flushPromises();
    expect(wrapper.classes()).contains('mb-home--mars');
    expect(wrapper.findComponent({name: 'MobileTurnSheet'}).exists()).is.false;
  });
});
