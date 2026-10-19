import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '@tests/client/components/getLocalVue';
import AppBackground from '@/client/components/AppBackground.vue';
import {BACKGROUND_WIDTHS} from '@/client/components/appBackgroundVariants';
import {BACKGROUND_CREDITS, backgroundFallback, backgroundSources} from '@/client/components/appBackground';

describe('AppBackground', () => {
  it('offers portrait before landscape, each as AVIF, WebP and JPEG', () => {
    const wrapper = mount(AppBackground, {...globalConfig});
    const sources = wrapper.findAll('source');
    const types = ['image/avif', 'image/webp', 'image/jpeg'];
    expect(sources.map((source) => source.attributes('type'))).deep.eq([...types, ...types]);
    expect(sources[0].attributes('media')).eq('(orientation: portrait)');
    expect(sources[3].attributes('media')).is.undefined;
  });

  it('falls back to JPEG', () => {
    const wrapper = mount(AppBackground, {...globalConfig});
    expect(wrapper.find('img').attributes('src')).eq('assets/background/mars/milky-way-landscape-1920.jpg');
  });

  it('lists every generated width in the srcset', () => {
    const wrapper = mount(AppBackground, {...globalConfig});
    const landscape = wrapper.findAll('source')[3].attributes('srcset') ?? '';
    for (const width of BACKGROUND_WIDTHS.landscape) {
      expect(landscape).contains(`assets/background/mars/milky-way-landscape-${width}.avif ${width}w`);
    }
  });

  it('shows the image credit with a link to the source', () => {
    const wrapper = mount(AppBackground, {...globalConfig, props: {showCredit: true}});
    const credit = wrapper.find('.app-background-credit');
    expect(credit.text().replace(/\s+/g, ' ')).eq('Background photo: Milky Way · ESO · S. Brunier · CC BY 4.0');
    expect(credit.attributes('href')).eq('https://www.eso.org/public/images/eso0932a/');
  });

  it('has its own picture for the Dune theme, without a credit', () => {
    expect(backgroundFallback('dune')).eq('assets/background/dune/desert-universe-landscape-1920.jpg');
    expect(backgroundSources('dune')[0].srcset).contains('assets/background/dune/desert-universe-portrait-540.avif 540w');
    expect(BACKGROUND_CREDITS.dune).is.undefined;
  });

  it('hides the credit when the corner is taken', () => {
    const wrapper = mount(AppBackground, {...globalConfig, props: {showCredit: false}});
    expect(wrapper.find('.app-background-credit').exists()).to.be.false;
  });
});
