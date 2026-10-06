import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PageTitle from '@/client/components/common/PageTitle.vue';
import MarsHomeLink from '@/client/components/common/MarsHomeLink.vue';

describe('PageTitle', () => {
  it('shows the logo and the page name', () => {
    const wrapper = shallowMount(PageTitle, {...globalConfig, props: {title: 'Cards List'}});
    expect(wrapper.findComponent(MarsHomeLink).exists()).is.true;
    expect(wrapper.text()).contains('Terraforming Mars – ');
    expect(wrapper.find('a[data-page-title-link]').exists()).is.false;
  });

  it('page name links to titleHref when given', () => {
    const wrapper = shallowMount(PageTitle, {...globalConfig, props: {title: 'Statistics', titleHref: 'stats'}});
    expect(wrapper.find('a[data-page-title-link]').attributes('href')).eq('stats');
  });
});
