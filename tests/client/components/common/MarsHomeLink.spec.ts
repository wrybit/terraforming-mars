import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MarsHomeLink from '@/client/components/common/MarsHomeLink.vue';

describe('MarsHomeLink', () => {
  it('links to the start screen in the same tab', () => {
    const home = shallowMount(MarsHomeLink, {...globalConfig}).find('a.page-title-home');
    expect(home.attributes('href')).eq('.');
    expect(home.attributes('target')).is.undefined;
  });
});
