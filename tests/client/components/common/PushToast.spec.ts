import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {afterEach, beforeEach, vi} from 'vitest';
import {globalConfig} from '../getLocalVue';
import PushToast from '@/client/components/common/PushToast.vue';
import {LOBBY_PUSH_TOAST} from '@/common/lobby/LobbyPushModel';
import {SoundManager} from '@/client/utils/SoundManager';

// Stand-in for the service worker channel: the test sends what client/sw.ts would send
const listeners: Array<(event: MessageEvent) => void> = [];
function sendToast(tag: string): void {
  const message = {title: 'Bob joined', body: 'Your game', url: 'lobby', tag};
  listeners.forEach((listener) => listener(new MessageEvent('message', {data: {type: LOBBY_PUSH_TOAST, message}})));
}

describe('PushToast', () => {
  beforeEach(() => {
    listeners.length = 0;
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: {
        addEventListener: (_: string, listener: (event: MessageEvent) => void) => listeners.push(listener),
        removeEventListener: () => {},
        startMessages: () => {},
      },
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('shows nothing without a message from the service worker', () => {
    expect(mount(PushToast, {...globalConfig}).find('.push-toasts').exists()).is.false;
  });

  it('plays the sound, shows a countdown and closes when the countdown has run out', async () => {
    const sound = vi.spyOn(SoundManager, 'pushToast').mockImplementation(() => {});
    const wrapper = mount(PushToast, {...globalConfig});
    sendToast('room-1');
    await wrapper.vm.$nextTick();
    expect(sound).toHaveBeenCalledOnce();
    const countdown = wrapper.find('.push-toast-countdown');
    expect(countdown.exists()).is.true;
    await countdown.trigger('animationend');
    expect(wrapper.find('.push-toast').exists()).is.false;
  });
});
