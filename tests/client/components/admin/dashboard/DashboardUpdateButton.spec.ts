import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import DashboardUpdateButton from '@/client/components/admin/dashboard/DashboardUpdateButton.vue';
import {ServerDashboard} from '@/common/admin/ServerDashboard';

const commit = (hash: string) => ({hash, time: '2026-10-13T12:00:00+02:00', title: `Commit ${hash}`});

function dashboardWith(head: string, requested = false): ServerDashboard {
  return {
    games: {running: 1, finished: 0, playersOnline: 1},
    build: {head, builtAt: 'n/a'},
    commits: [commit('bbbbbbbbb')],
    upstream: {measuredAtMs: 0, branch: 'main', commits: [commit('aaaaaaaaa'), commit('bbbbbbbbb')]},
    updateRequest: requested ? {requestedAtMs: 0} : undefined,
  } as ServerDashboard;
}

describe('DashboardUpdateButton', () => {
  it('is hidden while the server runs the newest commit', () => {
    const wrapper = mount(DashboardUpdateButton, {...globalConfig, props: {dashboard: dashboardWith('aaaaaaaaa')}});
    expect(wrapper.find('.server-dashboard-update').exists()).is.false;
  });

  it('offers the update when behind and asks before interrupting players', async () => {
    const wrapper = mount(DashboardUpdateButton, {...globalConfig, props: {dashboard: dashboardWith('bbbbbbbbb')}});
    await wrapper.find('button').trigger('click');
    expect(wrapper.text()).contains('Players online now: 1');
    expect(wrapper.text()).contains('Yes, update');
  });

  it('shows the waiting request instead of the button', () => {
    const wrapper = mount(DashboardUpdateButton, {...globalConfig, props: {dashboard: dashboardWith('bbbbbbbbb', true)}});
    expect(wrapper.find('button').exists()).is.false;
    expect(wrapper.text()).contains('Update requested – starting now');
  });
});
