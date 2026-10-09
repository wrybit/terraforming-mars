import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {computed, defineComponent, h, provide, ref} from 'vue';
import {globalConfig} from './getLocalVue';
import TabPanelCaption from '@/client/components/TabPanelCaption.vue';
import {TAB_PANEL_CAPTION} from '@/client/components/tabPanelCaption';
import {mobileLayout} from '@/client/utils/mobileLayout';

describe('TabPanelCaption', () => {
  afterEach(() => {
    mobileLayout.value = false;
  });

  it('renders nothing outside a tab panel', () => {
    const wrapper = mount(TabPanelCaption, globalConfig);
    expect(wrapper.find('.or-tab-panel-caption').exists()).is.false;
  });

  it('shows the question of the tab panel and registers while shown', async () => {
    const consumers = ref(0);
    const Panel = defineComponent({
      setup() {
        provide(TAB_PANEL_CAPTION, {title: computed(() => 'Select prelude card to play'), consumers});
        return () => h(TabPanelCaption);
      },
    });
    const wrapper = mount(Panel, globalConfig);
    expect(wrapper.find('.or-tab-panel-caption').text()).eq('Select prelude card to play');
    expect(consumers.value).eq(1);

    // Mobile view has no header row: the question stays at the top of the box
    mobileLayout.value = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.or-tab-panel-caption').exists()).is.false;
    expect(consumers.value).eq(0);

    mobileLayout.value = false;
    await wrapper.vm.$nextTick();
    wrapper.unmount();
    expect(consumers.value).eq(0);
  });
});
