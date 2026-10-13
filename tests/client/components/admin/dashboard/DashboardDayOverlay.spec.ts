import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import DashboardDayOverlay from '@/client/components/admin/dashboard/DashboardDayOverlay.vue';

describe('DashboardDayOverlay', () => {
  it('draws every day, today highlighted, and the average over the days that had the slot', () => {
    // 20:00 is slot 240 (12 slots per hour)
    const full = Array.from({length: 288}, (_, slot) => (slot === 240 ? 4 : 0));
    const wrapper = mount(DashboardDayOverlay, {...globalConfig, props: {profiles: [
      {start: '2026-10-12', slots: full},
      {start: '2026-10-13', slots: full.map((value) => value / 2)},
      // Today up to 10:00: only counts for the slots that already passed
      {start: '2026-10-14', slots: Array(121).fill(0)},
    ]}});
    expect(wrapper.findAll('.dashboard-day-overlay-day')).has.length(3);
    expect(wrapper.findAll('.dashboard-day-overlay-day--today')).has.length(1);
    const vm = wrapper.vm as unknown as {average: Array<number>};
    expect(vm.average[240]).eq(3);
    expect(vm.average[100]).eq(0);
    expect(wrapper.text()).contains('3 days');
  });
});
