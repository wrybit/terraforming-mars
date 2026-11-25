import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../../getLocalVue';
import DashboardCard from '@/client/components/admin/dashboard/DashboardCard.vue';

describe('DashboardCard', () => {
  const slots = {default: '<p class="content">Values</p>'};

  it('shows the title and a spinner in its final size until the values are there', () => {
    const wrapper = mount(DashboardCard, {...globalConfig, props: {title: 'Disk', ready: false, size: 'disk'}, slots});
    expect(wrapper.find('h2').text()).eq('Disk');
    expect(wrapper.find('.loading-spinner').exists()).is.true;
    expect(wrapper.find('section').classes()).contains('dashboard-card--disk');
    expect(wrapper.find('.content').exists()).is.false;
  });

  it('shows the content once ready', () => {
    const wrapper = mount(DashboardCard, {...globalConfig, props: {title: 'Disk', ready: true, size: 'disk'}, slots});
    expect(wrapper.find('.content').exists()).is.true;
    expect(wrapper.find('.loading-spinner').exists()).is.false;
    expect(wrapper.find('section').classes()).not.contains('dashboard-card--loading');
  });

  it('names the failure instead of spinning on', () => {
    const wrapper = mount(DashboardCard, {...globalConfig, props: {title: 'Disk', ready: false, size: 'disk', error: 'HTTP 502'}, slots});
    expect(wrapper.find('.dashboard-card-error').text()).contains('HTTP 502');
    expect(wrapper.find('.loading-spinner').exists()).is.false;
  });
});
