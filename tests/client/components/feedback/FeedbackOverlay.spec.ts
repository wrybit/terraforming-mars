import {flushPromises, mount} from '@vue/test-utils';
import {vi} from 'vitest';
import {expect} from 'chai';
import {nextTick} from 'vue';
import {globalConfig} from '../getLocalVue';
import FeedbackOverlay from '@/client/components/feedback/FeedbackOverlay.vue';
import {closeFeedback, feedbackOpen, isFeedbackHotkey} from '@/client/components/feedback/feedbackState';
import {resetFeedbackConfig} from '@/client/components/feedback/feedbackAvailability';

async function openWithText(text: string) {
  const wrapper = mount(FeedbackOverlay, {...globalConfig, props: {view: undefined}, attachTo: document.body});
  window.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyO'}));
  await flushPromises();
  const general = document.getElementById('feedback-general') as HTMLTextAreaElement;
  general.value = text;
  general.dispatchEvent(new Event('input'));
  await nextTick();
  return wrapper;
}

describe('FeedbackOverlay', () => {
  afterEach(() => {
    closeFeedback();
    resetFeedbackConfig();
    vi.unstubAllGlobals();
  });

  it('opens with the O key, not while typing or with modifiers', () => {
    const input = document.createElement('input');
    expect(isFeedbackHotkey(new KeyboardEvent('keydown', {code: 'KeyO'}))).is.true;
    expect(isFeedbackHotkey(new KeyboardEvent('keydown', {code: 'KeyO', ctrlKey: true}))).is.false;
    const typing = new KeyboardEvent('keydown', {code: 'KeyO'});
    Object.defineProperty(typing, 'target', {value: input});
    expect(isFeedbackHotkey(typing)).is.false;
  });

  it('shows the form once opened and needs a text before sending', async () => {
    const wrapper = mount(FeedbackOverlay, {...globalConfig, props: {view: undefined}, attachTo: document.body});
    expect(document.querySelector('.feedback-overlay')).is.null;
    window.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyO'}));
    await nextTick();
    expect(feedbackOpen.value).is.true;
    const send = document.querySelector('.feedback-send') as HTMLButtonElement;
    expect(send.disabled).is.true;
    const general = document.getElementById('feedback-general') as HTMLTextAreaElement;
    general.value = 'Cards are too small';
    general.dispatchEvent(new Event('input'));
    await nextTick();
    expect(send.disabled).is.false;
    window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    await nextTick();
    expect(feedbackOpen.value).is.false;
    wrapper.unmount();
  });

  it('without delivery on the server: no contact fields, prepares a GitHub issue of the tester', async () => {
    resetFeedbackConfig({enabled: true, serverDelivery: false});
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const wrapper = await openWithText('Cards are too small');
    expect(document.getElementById('feedback-name')).is.null;
    (document.querySelector('.feedback-form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await flushPromises();
    const link = document.querySelector('.feedback-issue a') as HTMLAnchorElement;
    expect(link.href).to.match(/^https:\/\/github\.com\/wrybit\/terraforming-mars\/issues\/new\?title=Feedback/);
    expect(decodeURIComponent(link.href.replace(/\+/g, ' '))).to.include('> Cards are too small');
    // No clipboard in the test browser: the tester is asked to copy it with the button
    expect(document.querySelector('.feedback-issue__state')?.textContent).to.include('Not in your clipboard yet');
    expect(document.querySelector('.feedback-issue__copy')).is.not.null;
    expect(document.getElementById('feedback-general')).is.null;
    expect(fetchMock.mock.calls).has.length(0);
    expect(feedbackOpen.value).is.true;
    wrapper.unmount();
  });

  it('with delivery on the server: contact fields, sends the report and closes', async () => {
    resetFeedbackConfig({enabled: true, serverDelivery: true});
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({status: 'sent'}), {status: 200}));
    vi.stubGlobal('fetch', fetchMock);
    const wrapper = await openWithText('Cards are too small');
    expect(document.getElementById('feedback-name')).is.not.null;
    (document.querySelector('.feedback-form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    await flushPromises();
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).eq('api/feedback');
    expect(document.querySelector('.feedback-issue')).is.null;
    wrapper.unmount();
  });
});
