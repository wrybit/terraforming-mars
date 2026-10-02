import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {defineComponent, h, provide} from 'vue';
import {globalConfig} from './getLocalVue';
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import {TAB_PANEL_FOOTER} from '@/client/components/tabPanelFooter';

describe('TabPanelFooterSlot', () => {
  it('renders its content in place outside a tab panel', () => {
    const wrapper = mount(TabPanelFooterSlot, {
      ...globalConfig,
      slots: {default: '<button class="probe">OK</button>'},
    });
    expect(wrapper.find('.probe').exists()).is.true;
  });

  it('moves its content into the footer of the tab panel', async () => {
    // Tab box with footer area; the content is in the template before the footer
    const Panel = defineComponent({
      setup(_, {slots}) {
        provide(TAB_PANEL_FOOTER, '#test-footer');
        return () => h('div', [slots.default?.(), h('div', {id: 'test-footer'})]);
      },
    });
    const wrapper = mount(Panel, {
      ...globalConfig,
      attachTo: document.body,
      slots: {default: () => h(TabPanelFooterSlot, null, () => h('button', {class: 'probe'}, 'OK'))},
    });
    await wrapper.vm.$nextTick();
    expect(document.querySelector('#test-footer .probe')).is.not.null;
    wrapper.unmount();
  });
});
