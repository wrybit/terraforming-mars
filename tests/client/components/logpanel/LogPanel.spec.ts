import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import LogMessageComponent from '@/client/components/logpanel/LogMessageComponent.vue';
import {fakeViewModel} from '../testHelpers';
import {LogMessage} from '@/common/logs/LogMessage';
import {LogMessageType} from '@/common/logs/LogMessageType';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {ParticipantId, SpaceId} from '@/common/Types';

type Wrapper = ReturnType<typeof shallowMount>;

describe('LogPanel', () => {
  let originalFetch: any;
  let originalGetClientRects: typeof HTMLElement.prototype.getClientRects;
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame;
  let fetchCalls: Array<string>;
  let idCounter = 0;

  // Each test gets its own participant, so the cache of finished generations doesn't leak between tests
  function viewModelAt(generation: number) {
    const base = fakeViewModel({id: ('p-log-' + (idCounter++)) as ParticipantId});
    return {...base, game: {...base.game, generation}};
  }

  function line(text: string, type = LogMessageType.DEFAULT): LogMessage {
    return new LogMessage(type, text, []);
  }

  function mount(viewModel: ReturnType<typeof viewModelAt>): Wrapper {
    return shallowMount(LogPanel, {...globalConfig, props: {viewModel}});
  }

  // The log's own box as a scroll box with a fixed size (jsdom has no layout)
  function makeScrollable(wrapper: Wrapper, scrollHeight = 520, clientHeight = 200) {
    const element = wrapper.find('#logpanel-scrollable').element as HTMLElement;
    let scrollTop = 0;
    element.style.overflowY = 'auto';
    Object.defineProperty(element, 'scrollTop', {configurable: true, get: () => scrollTop, set: (value: number) => {
      scrollTop = value;
    }});
    Object.defineProperty(element, 'scrollHeight', {configurable: true, get: () => scrollHeight});
    Object.defineProperty(element, 'clientHeight', {configurable: true, get: () => clientHeight});
    return {
      element,
      getScrollTop: () => scrollTop,
      setScrollTop: (value: number) => {
        scrollTop = value;
      },
    };
  }

  async function flush(wrapper: Wrapper) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
  }

  beforeEach(() => {
    originalFetch = (global as any).fetch;
    originalGetClientRects = HTMLElement.prototype.getClientRects;
    originalRequestAnimationFrame = window.requestAnimationFrame;
    // jsdom renders nothing: the log counts as visible, frames run immediately
    HTMLElement.prototype.getClientRects = function() {
      return [{}] as unknown as DOMRectList;
    };
    window.requestAnimationFrame = (callback: (time: number) => void) => {
      callback(0);
      return 0;
    };
    fetchCalls = [];
    (global as any).fetch = (url: string) => {
      fetchCalls.push(url);
      const generation = Number(new URL(url, 'http://localhost').searchParams.get('generation'));
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([line('Generation ${0}', LogMessageType.NEW_GENERATION), line('entry of generation ' + generation)]),
      });
    };
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
    HTMLElement.prototype.getClientRects = originalGetClientRects;
    window.requestAnimationFrame = originalRequestAnimationFrame;
  });

  it('mounts without errors', () => {
    expect(mount(viewModelAt(1)).exists()).to.be.true;
  });

  it('shows all generations as one stream with a header each, without the server\'s generation lines', async () => {
    const wrapper = mount(viewModelAt(3));
    await flush(wrapper);

    expect(fetchCalls.map((url) => new URL(url, 'http://localhost').searchParams.get('generation'))).to.have.members(['1', '2', '3']);
    const sections = wrapper.findAll('.log-generation');
    expect(sections.map((section) => section.attributes('data-generation'))).deep.eq(['1', '2', '3']);
    expect(sections.map((section) => section.find('.log-generation-marker').text())).deep.eq(['1', '2', '3']);
    expect(sections.map((section) => section.find('.log-generation-title').text())).deep.eq(['1Generation 1', '2Generation 2', '3Generation 3']);
    // Only the regular line remains in each generation
    expect(wrapper.findAllComponents(LogMessageComponent)).has.length(3);
  });

  it('loads finished generations only once', async () => {
    const viewModel = viewModelAt(3);
    const first = mount(viewModel);
    await flush(first);
    first.unmount();
    fetchCalls.length = 0;

    const second = mount(viewModel);
    await second.vm.$nextTick();
    // The history is there before any request returns
    expect(second.findAll('.log-generation')).has.length(3);
    await flush(second);
    expect(fetchCalls).has.length(1);
    expect(fetchCalls[0]).includes('generation=3');
  });

  it('emits spaceClicked when a log message emits spaceClicked', async () => {
    const wrapper = mount(viewModelAt(1));
    await flush(wrapper);

    const message = new LogMessage(LogMessageType.DEFAULT, '${0}', [
      {type: LogMessageDataType.SPACE, value: '05' as SpaceId},
    ]);
    (wrapper.vm as any).sections[0].messages.push(message);
    await wrapper.vm.$nextTick();

    await wrapper.findAllComponents(LogMessageComponent).at(-1)!.vm.$emit('spaceClicked', '05');

    expect(wrapper.emitted('spaceClicked')).to.deep.eq([['05']]);
  });

  it('starts at the end of the log and selects the current generation', async () => {
    const wrapper = mount(viewModelAt(3));
    const panel = makeScrollable(wrapper);
    await flush(wrapper);

    expect(panel.getScrollTop()).eq(320);
    expect((wrapper.vm as any).selectedGeneration).eq(3);
    expect((wrapper.vm as any).showScrollToBottomButton).is.false;
  });

  it('shows the scroll button only when away from the bottom', async () => {
    const wrapper = mount(viewModelAt(1));
    const panel = makeScrollable(wrapper);
    await flush(wrapper);

    panel.setScrollTop(100);
    await wrapper.find('#logpanel-scrollable').trigger('scroll');
    expect((wrapper.vm as any).showScrollToBottomButton).is.true;

    panel.setScrollTop(320);
    await wrapper.find('#logpanel-scrollable').trigger('scroll');
    expect((wrapper.vm as any).showScrollToBottomButton).is.false;
  });

  it('selects the tab of the generation scrolled to', async () => {
    const wrapper = mount(viewModelAt(3));
    const panel = makeScrollable(wrapper);
    await flush(wrapper);

    // Headers of generations 1 and 2 have passed the top of the box, generation 3 is still below
    const tops = [-300, -40, 150];
    wrapper.findAll('.log-generation').forEach((section, index) => {
      (section.element as HTMLElement).getBoundingClientRect = () => ({top: tops[index]}) as DOMRect;
    });
    panel.setScrollTop(100);
    await wrapper.find('#logpanel-scrollable').trigger('scroll');

    expect((wrapper.vm as any).selectedGeneration).eq(2);
  });

  it('scrolls to a generation when its tab is chosen', async () => {
    const wrapper = mount(viewModelAt(3));
    const panel = makeScrollable(wrapper);
    await flush(wrapper);
    panel.setScrollTop(300);

    (wrapper.findAll('.log-generation')[1].element as HTMLElement).getBoundingClientRect = () => ({top: -180}) as DOMRect;
    (wrapper.vm as any).selectGeneration(2);

    expect((wrapper.vm as any).selectedGeneration).eq(2);
    expect(panel.getScrollTop()).eq(112);
  });

  it('keeps the reading position across a remount', async () => {
    const viewModel = viewModelAt(3);
    const first = mount(viewModel);
    const firstPanel = makeScrollable(first);
    await flush(first);
    firstPanel.setScrollTop(120);
    first.unmount();

    const second = mount(viewModel);
    const secondPanel = makeScrollable(second);
    await flush(second);

    expect(secondPanel.getScrollTop()).eq(120);
    expect((second.vm as any).following).is.false;
  });

  // The real app never patches an existing LogPanel's props in place: App.vue forces a
  // full unmount/remount (via a `:key` bump) on every game-state refresh.
  it('follows the end of the log across a remount into a new generation', async () => {
    const viewModel = viewModelAt(2);
    const first = mount(viewModel);
    const firstPanel = makeScrollable(first);
    await flush(first);
    expect(firstPanel.getScrollTop()).eq(320);
    first.unmount();

    const second = mount({...viewModel, game: {...viewModel.game, generation: 3}});
    const panel = makeScrollable(second, 640);
    await flush(second);

    expect((second.vm as any).selectedGeneration).eq(3);
    expect(panel.getScrollTop()).eq(440);
  });
});
