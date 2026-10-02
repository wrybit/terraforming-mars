import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import HelpOverlay from '@/client/components/helpOverlay/HelpOverlay.vue';
import {HELP_OVERLAY_TABS} from '@/client/components/helpOverlay/helpOverlayTabs';

describe('HelpOverlay', () => {
  it('renders one tab per help page', () => {
    const wrapper = shallowMount(HelpOverlay, {...globalConfig, props: {closable: true}});
    expect(wrapper.findAll('.help-overlay-tab')).has.length(HELP_OVERLAY_TABS.length);
  });

  it('switches tabs', async () => {
    const wrapper = shallowMount(HelpOverlay, {...globalConfig, props: {closable: true}});
    const tabs = wrapper.findAll('.help-overlay-tab');
    await tabs[2].trigger('click');
    expect(tabs[2].attributes('aria-selected')).eq('true');
    expect(tabs[0].attributes('aria-selected')).eq('false');
  });

  it('emits close only when closable', async () => {
    const closable = shallowMount(HelpOverlay, {...globalConfig, props: {closable: true}});
    await closable.find('.help-overlay-close').trigger('click');
    expect(closable.emitted('close')).has.length(1);

    const page = shallowMount(HelpOverlay, {...globalConfig});
    expect(page.find('.help-overlay-close').exists()).is.false;
  });
});
