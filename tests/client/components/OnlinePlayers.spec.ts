import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import OnlinePlayers from '@/client/components/OnlinePlayers.vue';
import {applyServerStatus, resetServerStatus} from '@/client/utils/serverStatus';

describe('OnlinePlayers', () => {
  afterEach(() => resetServerStatus());

  it('shows nothing until the server answered', () => {
    expect(mount(OnlinePlayers, globalConfig).find('.online-players').exists()).is.false;
  });

  it('shows how many are playing; nobody: the light stays still', async () => {
    applyServerStatus({updating: false, startedAt: 1, activeParticipants: 2});
    const wrapper = mount(OnlinePlayers, globalConfig);
    expect(wrapper.text()).to.include('2');
    expect(wrapper.find('.online-players').classes()).not.to.include('online-players--none');
    applyServerStatus({updating: false, startedAt: 1, activeParticipants: 0});
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.online-players').classes()).to.include('online-players--none');
  });
});
