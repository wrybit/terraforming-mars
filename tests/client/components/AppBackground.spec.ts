import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '@tests/client/components/getLocalVue';
import AppBackground from '@/client/components/AppBackground.vue';
import {BACKGROUND_WIDTHS} from '@/client/components/appBackgroundVariants';

describe('AppBackground', () => {
  it('offers portrait before landscape, each as AVIF and WebP', () => {
    const wrapper = mount(AppBackground, {...globalConfig});
    const sources = wrapper.findAll('source');
    expect(sources.map((source) => source.attributes('type'))).deep.eq(['image/avif', 'image/webp', 'image/avif', 'image/webp']);
    expect(sources[0].attributes('media')).eq('(orientation: portrait)');
    expect(sources[2].attributes('media')).is.undefined;
  });

  it('lists every generated width in the srcset', () => {
    const wrapper = mount(AppBackground, {...globalConfig});
    const landscape = wrapper.findAll('source')[2].attributes('srcset') ?? '';
    for (const width of BACKGROUND_WIDTHS.landscape) {
      expect(landscape).contains(`assets/background/milky-way-landscape-${width}.avif ${width}w`);
    }
  });

  it('shows the image credit with a link to the source', () => {
    const wrapper = mount(AppBackground, {...globalConfig, props: {showCredit: true}});
    const credit = wrapper.find('.app-background-credit');
    expect(credit.text()).contains('ESO/S. Brunier');
    expect(credit.attributes('href')).eq('https://www.eso.org/public/images/eso0932a/');
  });

  it('hides the credit when the corner is taken', () => {
    const wrapper = mount(AppBackground, {...globalConfig, props: {showCredit: false}});
    expect(wrapper.find('.app-background-credit').exists()).to.be.false;
  });
});
