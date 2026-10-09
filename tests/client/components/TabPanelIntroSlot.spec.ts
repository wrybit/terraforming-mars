import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {defineComponent, h, provide, ref} from 'vue';
import {globalConfig} from './getLocalVue';
import TabPanelIntroSlot from '@/client/components/TabPanelIntroSlot.vue';
import {TAB_PANEL_INTRO} from '@/client/components/tabPanelIntro';
import {mobileLayout} from '@/client/utils/mobileLayout';

describe('TabPanelIntroSlot', () => {
  afterEach(() => {
    mobileLayout.value = false;
  });

  it('renders nothing outside a tab panel', () => {
    const wrapper = mount(TabPanelIntroSlot, globalConfig);
    expect(wrapper.find('.or-tab-panel-intro-slot').exists()).is.false;
  });

  it('renders the target for the intro and registers while present', async () => {
    const consumers = ref(0);
    const Panel = defineComponent({
      setup() {
        provide(TAB_PANEL_INTRO, {targetId: 'test-intro', consumers});
        return () => h(TabPanelIntroSlot);
      },
    });
    const wrapper = mount(Panel, globalConfig);
    expect(wrapper.find('#test-intro').exists()).is.true;
    expect(consumers.value).eq(1);

    // Mobile view has no header row: the intro stays at the top of the box
    mobileLayout.value = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('#test-intro').exists()).is.false;
    expect(consumers.value).eq(0);

    mobileLayout.value = false;
    await wrapper.vm.$nextTick();
    wrapper.unmount();
    expect(consumers.value).eq(0);
  });
});
