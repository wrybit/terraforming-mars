import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import OnlinePlayers from '@/client/components/OnlinePlayers.vue';
import {applyServerStatus, resetServerStatus} from '@/client/utils/serverStatus';

describe('OnlinePlayers', () => {
  beforeEach(() => resetServerStatus());
  afterEach(() => resetServerStatus());

  it('shows nothing until the server answered', () => {
    expect(mount(OnlinePlayers, globalConfig).find('.online-players').exists()).is.false;
  });

  it('shows how many are playing from three on, fewer: nothing', async () => {
    applyServerStatus({updating: false, startedAt: 1, activeParticipants: 3});
    const wrapper = mount(OnlinePlayers, globalConfig);
    expect(wrapper.find('.online-players').exists()).is.true;
    expect(wrapper.text()).to.include('3');
    applyServerStatus({updating: false, startedAt: 1, activeParticipants: 2});
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.online-players').exists()).is.false;
  });
});
