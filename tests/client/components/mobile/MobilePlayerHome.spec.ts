import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MobilePlayerHome from '@/client/components/mobile/MobilePlayerHome.vue';
import {fakePlayerViewModel} from '../testHelpers';
import {FakeLocalStorage} from '../FakeLocalStorage';

describe('MobilePlayerHome', () => {
  let localStorage: FakeLocalStorage;

  beforeEach(() => {
    localStorage = new FakeLocalStorage();
    FakeLocalStorage.register(localStorage);
  });

  afterEach(() => {
    FakeLocalStorage.deregister(localStorage);
  });

  function mountHome() {
    return shallowMount(MobilePlayerHome, {
      ...globalConfig,
      // Fußleiste echt rendern: die Tests klicken ihre Einträge
      global: {...globalConfig.global, stubs: {...globalConfig.global.stubs, MobileNav: false}},
      props: {playerView: fakePlayerViewModel()},
    });
  }

  it('mounts with navigation and Mars as first screen when not acting', () => {
    const wrapper = mountHome();
    expect(wrapper.find('.mb-nav').exists()).to.be.true;
    expect(wrapper.findAll('.mb-nav-item')).to.have.length(5);
    expect(wrapper.classes()).to.include('mb-home--mars');
  });

  it('switches screens from the navigation', async () => {
    const wrapper = mountHome();
    await wrapper.find('.mb-nav-item--log').trigger('click');
    expect(wrapper.classes()).to.include('mb-home--log');
  });

  it('opens the sheet with the waiting players when it is not the own turn', async () => {
    const wrapper = mountHome();
    await wrapper.find('.mb-nav-item--turn').trigger('click');
    expect(wrapper.classes()).to.not.include('mb-home--turn');
    expect((wrapper.vm as unknown as {sheetOpen: boolean}).sheetOpen).to.be.true;
  });
});
