import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import DashboardMeter from '@/client/components/admin/dashboard/DashboardMeter.vue';

describe('DashboardMeter', () => {
  it('shows used of total and colors by fill level', () => {
    const GB = 1024 ** 3;
    const meter = (used: number) => mount(DashboardMeter, {...globalConfig, props: {label: 'Disk', used: used * GB, total: 100 * GB}});
    expect(meter(50).text()).contains('50.0 GB of 100.0 GB (50 %)');
    expect(meter(50).find('.dashboard-meter-fill--normal').exists()).is.true;
    expect(meter(80).find('.dashboard-meter-fill--warning').exists()).is.true;
    expect(meter(95).find('.dashboard-meter-fill--critical').exists()).is.true;
  });

  it('shows only the share for percent values', () => {
    const wrapper = mount(DashboardMeter, {...globalConfig, props: {label: 'Processor load', used: 12.4, total: 100, unit: 'percent'}});
    expect(wrapper.find('.dashboard-meter-numbers').text()).eq('12 %');
  });
});
