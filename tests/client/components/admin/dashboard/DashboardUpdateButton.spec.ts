import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import DashboardUpdateButton from '@/client/components/admin/dashboard/DashboardUpdateButton.vue';
import {DashboardDeployRun, ServerDashboard} from '@/common/admin/ServerDashboard';

const commit = (hash: string) => ({hash, time: '2026-10-13T12:00:00+02:00', title: `Commit ${hash}`});

function dashboardWith(head: string, requested = false, deployRun?: DashboardDeployRun): ServerDashboard {
  return {
    games: {running: 1, finished: 0, playersOnline: 1},
    build: {head, builtAt: 'n/a'},
    commits: [commit('bbbbbbbbb')],
    upstream: {measuredAtMs: 0, branch: 'main', commits: [commit('aaaaaaaaa'), commit('bbbbbbbbb')]},
    updateRequest: requested ? {requestedAtMs: 0} : undefined,
    deployRun,
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

  it('names how far behind and when the running commit was made', () => {
    const wrapper = mount(DashboardUpdateButton, {...globalConfig, props: {dashboard: dashboardWith('bbbbbbbbb')}});
    expect(wrapper.text()).contains('1 commits behind');
    expect(wrapper.text()).contains('Running commit from');
  });

  it('shows the waiting request instead of the button', () => {
    const wrapper = mount(DashboardUpdateButton, {...globalConfig, props: {dashboard: dashboardWith('bbbbbbbbb', true)}});
    expect(wrapper.find('button').exists()).is.false;
    expect(wrapper.text()).contains('Update requested – starting now');
  });

  it('shows the build as running instead of falling back to "behind"', () => {
    const wrapper = mount(DashboardUpdateButton, {...globalConfig, props: {dashboard: dashboardWith('bbbbbbbbb', false, {measuredAtMs: 0, outcome: 'building'})}});
    expect(wrapper.find('button').exists()).is.false;
    expect(wrapper.text()).contains('Building the new version…');
    expect(wrapper.find('.loading-bar').exists()).is.true;
  });

  it('names the unsigned commit and the approval command when the update was refused', () => {
    const refused: DashboardDeployRun = {measuredAtMs: 0, outcome: 'refused', blockedCommit: 'd145c0d5e', blockedRepository: 'lab'};
    const wrapper = mount(DashboardUpdateButton, {...globalConfig, props: {dashboard: dashboardWith('bbbbbbbbb', false, refused)}});
    expect(wrapper.find('.server-dashboard-deploy-problem--blocking').text()).contains('d145c0d5e');
    expect(wrapper.find('code').text()).eq('ops/shared/approve-deploy.sh lab');
    expect(wrapper.find('button').text()).eq('Update to latest');
  });

  it('shows no problem once the server is current', () => {
    const wrapper = mount(DashboardUpdateButton, {...globalConfig, props: {dashboard: dashboardWith('aaaaaaaaa', false, {measuredAtMs: 0, outcome: 'refused'})}});
    expect(wrapper.find('.server-dashboard-deploy-problem').exists()).is.false;
  });
});
