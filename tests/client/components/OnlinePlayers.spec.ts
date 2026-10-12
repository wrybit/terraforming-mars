import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import OnlinePlayers from '@/client/components/OnlinePlayers.vue';
import {applyServerStatus, resetServerStatus} from '@/client/utils/serverStatus';

describe('OnlinePlayers', () => {
  beforeEach(() => resetServerStatus());
  afterEach(() => resetServerStatus());

  it('shows nothing until the server answered, but keeps its space', () => {
    const wrapper = mount(OnlinePlayers, globalConfig);
    expect(wrapper.find('.online-players').exists()).is.true;
    expect(wrapper.find('.online-players--hidden').exists()).is.true;
  });

  it('shows how many are playing from the first player on, nobody: nothing', async () => {
    applyServerStatus({updating: false, startedAt: 1, activeParticipants: 3});
    const wrapper = mount(OnlinePlayers, globalConfig);
    expect(wrapper.find('.online-players--hidden').exists()).is.false;
    expect(wrapper.text()).to.include('3 players online');
    applyServerStatus({updating: false, startedAt: 1, activeParticipants: 1});
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.online-players--hidden').exists()).is.false;
    expect(wrapper.text()).to.include('1 player online');
    applyServerStatus({updating: false, startedAt: 1, activeParticipants: 0});
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.online-players--hidden').exists()).is.true;
    expect(wrapper.text()).not.to.include('0');
  });
});
