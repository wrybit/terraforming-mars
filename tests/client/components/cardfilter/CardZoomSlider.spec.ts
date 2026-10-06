import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CardZoomSlider from '@/client/components/cardfilter/CardZoomSlider.vue';
import {CARD_ZOOM_DEFAULT, CARD_ZOOM_MAX, cardZoomState, setCardZoom} from '@/client/utils/cardZoom';

describe('CardZoomSlider', () => {
  afterEach(() => setCardZoom(CARD_ZOOM_DEFAULT));

  it('sets the card size for all tabs as a CSS variable', async () => {
    const wrapper = mount(CardZoomSlider, {...globalConfig});
    await wrapper.find('input').setValue('0.6');
    expect(cardZoomState.zoom).eq(0.6);
    expect(document.documentElement.style.getPropertyValue('--card-zoom')).eq('0.6');
  });

  it('keeps the size within its limits', () => {
    setCardZoom(5);
    expect(cardZoomState.zoom).eq(CARD_ZOOM_MAX);
  });
});
