import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import InfoLink from '@/client/components/create/InfoLink.vue';

describe('InfoLink', () => {
  it('opens the link in a new tab', () => {
    const wrapper = mount(InfoLink, {...globalConfig, props: {href: 'https://example.com'}});
    const link = wrapper.find('a');
    expect(link.attributes('href')).eq('https://example.com');
    expect(link.attributes('target')).eq('_blank');
  });

  it('opens an info box for wiki links instead of a new tab', async () => {
    const wrapper = mount(InfoLink, {...globalConfig, props: {href: 'https://github.com/terraforming-mars/terraforming-mars/wiki/Variants#draft'}});
    expect(wrapper.find('a').exists()).is.false;
    expect(wrapper.find('button.create-game-info').exists()).is.true;
  });
});
