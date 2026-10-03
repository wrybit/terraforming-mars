import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PageTitle from '@/client/components/common/PageTitle.vue';

describe('PageTitle', () => {
  it('logo links to the start screen in the same tab', () => {
    const wrapper = shallowMount(PageTitle, {...globalConfig, props: {title: 'Cards List'}});
    const home = wrapper.find('a.page-title-home');
    expect(home.attributes('href')).eq('.');
    expect(home.attributes('target')).is.undefined;
    expect(wrapper.text()).contains('Terraforming Mars – ');
    expect(wrapper.find('a[data-page-title-link]').exists()).is.false;
  });

  it('page name links to titleHref when given', () => {
    const wrapper = shallowMount(PageTitle, {...globalConfig, props: {title: 'Statistics', titleHref: 'stats'}});
    expect(wrapper.find('a[data-page-title-link]').attributes('href')).eq('stats');
  });
});
