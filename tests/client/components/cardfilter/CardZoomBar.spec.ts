import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CardZoomBar from '@/client/components/cardfilter/CardZoomBar.vue';
import {mobileLayout} from '@/client/utils/mobileLayout';

describe('CardZoomBar', () => {
  afterEach(() => {
    mobileLayout.value = false;
  });

  it('shows the zoom slider in the header row on desktop', () => {
    mobileLayout.value = false;
    const wrapper = mount(CardZoomBar, {...globalConfig, slots: {lead: '<button class="lead">x</button>'}});
    expect(wrapper.find('.card-filter-bar--zoom-only').exists()).is.true;
    expect(wrapper.find('.card-zoom-slider').exists()).is.true;
    expect(wrapper.find('.lead').exists()).is.true;
  });

  it('is not shown in the mobile view', () => {
    mobileLayout.value = true;
    const wrapper = mount(CardZoomBar, {...globalConfig});
    expect(wrapper.find('.card-filter-bar').exists()).is.false;
  });
});
