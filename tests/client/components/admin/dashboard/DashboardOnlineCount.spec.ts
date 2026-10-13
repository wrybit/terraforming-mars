import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import DashboardOnlineCount from '@/client/components/admin/dashboard/DashboardOnlineCount.vue';
import {calendarWeek, periodBars} from '@/client/components/admin/dashboard/dashboardFormat';

describe('DashboardOnlineCount', () => {
  it('blinks and shows the count large only while someone plays', () => {
    const active = mount(DashboardOnlineCount, {...globalConfig, props: {count: 3}});
    expect(active.find('.dashboard-online--active').exists()).is.true;
    expect(active.find('.online-players-light').exists()).is.true;
    expect(active.find('.dashboard-online-count').text()).eq('3');

    const quiet = mount(DashboardOnlineCount, {...globalConfig, props: {count: 0}});
    expect(quiet.find('.dashboard-online--active').exists()).is.false;
    expect(quiet.find('.online-players-light').exists()).is.false;
  });
});

describe('calendar weeks', () => {
  it('counts ISO weeks, also across the turn of the year', () => {
    expect(calendarWeek(new Date(2026, 9, 12))).eq(42);
    expect(calendarWeek(new Date(2026, 0, 1))).eq(1);
    // 1 January 2027 is a Friday: it still belongs to week 53 of 2026
    expect(calendarWeek(new Date(2027, 0, 1))).eq(53);
    expect(periodBars([{start: '2026-10-12', value: 3}], 'week')[0].label).eq('CW 42');
  });
});
