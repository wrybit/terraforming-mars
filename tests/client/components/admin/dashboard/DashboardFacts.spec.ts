import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import DashboardFacts from '@/client/components/admin/dashboard/DashboardFacts.vue';

describe('DashboardFacts', () => {
  it('renders label and value per row with an optional tone', () => {
    const wrapper = mount(DashboardFacts, {...globalConfig, props: {facts: [{label: 'Cores', value: '4'}, {label: 'Public address', value: 'Not reachable', tone: 'critical'}]}});
    expect(wrapper.findAll('dt').map((term) => term.text())).deep.eq(['Cores', 'Public address']);
    expect(wrapper.find('.dashboard-tone--critical').text()).eq('Not reachable');
  });
});
