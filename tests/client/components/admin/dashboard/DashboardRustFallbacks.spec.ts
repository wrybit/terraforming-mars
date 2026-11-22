import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import DashboardRustFallbacks from '@/client/components/admin/dashboard/DashboardRustFallbacks.vue';

describe('DashboardRustFallbacks', () => {
  it('shows the count of the last day and the newest cases', () => {
    const wrapper = mount(DashboardRustFallbacks, {...globalConfig, props: {fallbacks: {
      last24h: 1,
      recent: [{timeMs: Date.UTC(2026, 10, 22, 17), gameId: 'g1a2b', generation: 4, decision: 'card: Play project card', reason: 'rust bot exited (3)'}],
    }}});
    expect(wrapper.find('.dashboard-online-count').text()).eq('1');
    expect(wrapper.classes()).contains('dashboard-rust-fallbacks');
    expect(wrapper.find('.dashboard-rust-fallbacks--some').exists()).is.true;
    expect(wrapper.find('tbody').text()).contains('g1a2b').and.contains('rust bot exited (3)');
  });

  it('stays quiet without fallbacks', () => {
    const wrapper = mount(DashboardRustFallbacks, {...globalConfig, props: {fallbacks: {last24h: 0, recent: []}}});
    expect(wrapper.find('.dashboard-rust-fallbacks--some').exists()).is.false;
    expect(wrapper.find('table').exists()).is.false;
  });
});
