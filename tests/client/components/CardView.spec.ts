import {mount, flushPromises} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import CardView from '@/client/components/CardView.vue';

describe('CardView', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('shows the card named in the hash and follows hash changes', async () => {
    window.location.hash = '#Algae';
    const wrapper = mount(CardView, {...globalConfig});
    await flushPromises();
    expect(wrapper.find('.card-container').exists()).is.true;
    expect(wrapper.html()).to.contain('algae');
    window.location.hash = '#' + encodeURIComponent('Birds');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await flushPromises();
    expect(wrapper.html()).to.contain('birds');
  });

  it('shows nothing for an unknown name', async () => {
    window.location.hash = '#Not a card';
    const wrapper = mount(CardView, {...globalConfig});
    await flushPromises();
    expect(wrapper.find('.card-container').exists()).is.false;
  });
});
