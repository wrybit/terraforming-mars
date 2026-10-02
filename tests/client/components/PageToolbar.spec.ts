import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import PageToolbar from '@/client/components/PageToolbar.vue';

describe('PageToolbar', () => {
  it('shows language and settings', () => {
    const wrapper = shallowMount(PageToolbar, {
      ...globalConfig,
    });
    expect(wrapper.find('.page-toolbar').exists()).to.be.true;
    expect(wrapper.findComponent({name: 'LanguageIcon'}).exists()).to.be.true;
    expect(wrapper.findComponent({name: 'PreferencesIcon'}).exists()).to.be.true;
  });
});
