import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import InfoLink from '@/client/components/create/InfoLink.vue';

describe('InfoLink', () => {
  it('opens the link in a new tab', () => {
    const wrapper = mount(InfoLink, {...globalConfig, props: {href: 'https://example.com'}});
    expect(wrapper.attributes('href')).eq('https://example.com');
    expect(wrapper.attributes('target')).eq('_blank');
  });
});
