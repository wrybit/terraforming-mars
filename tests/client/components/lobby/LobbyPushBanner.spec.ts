import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import LobbyPushBanner from '@/client/components/lobby/LobbyPushBanner.vue';

describe('LobbyPushBanner', () => {
  it('jsdom has no push: the bar says so, without a button', () => {
    const wrapper = mount(LobbyPushBanner, {...globalConfig});
    expect(wrapper.find('.lobby-push-banner').exists()).is.true;
    expect(wrapper.find('.lobby-push-banner-button').exists()).is.false;
  });
});
