import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import DashboardCommits from '@/client/components/admin/dashboard/DashboardCommits.vue';
import {ServerDashboard} from '@/common/admin/ServerDashboard';

const commit = (hash: string) => ({hash, time: '2026-10-13T12:00:00+02:00', title: `Commit ${hash}`});

function dashboardWith(head: string, upstream?: Array<string>): ServerDashboard {
  return {
    games: {running: 0, finished: 0, playersOnline: 2},
    build: {head, builtAt: 'n/a'},
    commits: [commit('bbbbbbbbb')],
    upstream: upstream === undefined ? undefined : {measuredAtMs: 0, branch: 'main', commits: upstream.map(commit)},
  } as ServerDashboard;
}

describe('DashboardCommits', () => {
  it('highlights the running commit and offers the update when the server is behind', () => {
    const wrapper = mount(DashboardCommits, {...globalConfig, props: {dashboard: dashboardWith('bbbbbbb', ['aaaaaaaaa', 'bbbbbbbbb'])}});
    expect(wrapper.find('.server-dashboard-commit-live').text()).contains('Commit bbbbbbbbb');
    expect(wrapper.find('.server-dashboard-deploy-status').text()).eq('1 commits behind');
    expect(wrapper.text()).contains('Update to latest');
  });

  it('shows no update button when the server runs the newest commit', () => {
    const wrapper = mount(DashboardCommits, {...globalConfig, props: {dashboard: dashboardWith('aaaaaaaaa', ['aaaaaaaaa', 'bbbbbbbbb'])}});
    expect(wrapper.find('.server-dashboard-deploy-status').text()).eq('Up to date');
    expect(wrapper.text()).not.contains('Update to latest');
    expect(wrapper.text()).contains('Restart server');
  });

  it('asks before restarting and names the players online', async () => {
    const wrapper = mount(DashboardCommits, {...globalConfig, props: {dashboard: dashboardWith('bbbbbbbbb')}});
    // Without the deploy branch only the built commits, no status
    expect(wrapper.find('.server-dashboard-deploy-status').exists()).is.false;
    await wrapper.findAll('button').find((button) => button.text() === 'Restart server')!.trigger('click');
    expect(wrapper.text()).contains('Players online now: 2');
    expect(wrapper.text()).contains('Yes, restart');
  });
});
