import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import DashboardDayOverlay from '@/client/components/admin/dashboard/DashboardDayOverlay.vue';

describe('DashboardDayOverlay', () => {
  it('draws one line per day plus the average over the days that had the hour', () => {
    const full = Array.from({length: 24}, (_, hour) => (hour === 20 ? 4 : 0));
    const wrapper = mount(DashboardDayOverlay, {...globalConfig, props: {profiles: [
      {start: '2026-10-12', hours: full},
      {start: '2026-10-13', hours: full.map((value) => value / 2)},
      // Today up to 10:00: only counts for the hours that already passed
      {start: '2026-10-14', hours: Array(11).fill(0)},
    ]}});
    expect(wrapper.findAll('.dashboard-day-overlay-day')).has.length(3);
    expect(wrapper.findAll('.dashboard-day-overlay-day--recent')).has.length(3);
    const vm = wrapper.vm as unknown as {average: Array<number>};
    expect(vm.average[20]).eq(3);
    expect(vm.average[10]).eq(0);
  });
});
