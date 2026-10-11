import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import StatsSkeleton from '@/client/components/stats/StatsSkeleton.vue';
import {OVERVIEW_KPI_COUNT} from '@/client/components/stats/statsOverviewSections';
import {SHOWCASE_SIZE} from '@/client/components/stats/statsShowcase';

describe('StatsSkeleton', () => {
  it('shows the empty boxes of the overview and a loading bar', () => {
    const wrapper = mount(StatsSkeleton, {...globalConfig, props: {overview: true}});
    expect(wrapper.findAll('.stats-skeleton-kpi')).to.have.length(OVERVIEW_KPI_COUNT);
    expect(wrapper.findAll('.stats-skeleton-card')).to.have.length(2 * SHOWCASE_SIZE);
    expect(wrapper.findAll('.stats-card h2')).to.have.length(8);
    expect(wrapper.find('.loading-bar').exists()).is.true;
  });

  it('shows one empty box for the other views', () => {
    const wrapper = mount(StatsSkeleton, {...globalConfig, props: {overview: false}});
    expect(wrapper.findAll('.stats-card')).to.have.length(1);
    expect(wrapper.find('.loading-bar').exists()).is.true;
  });
});
