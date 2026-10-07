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

  function mountHome(playerView = fakePlayerViewModel()) {
    return shallowMount(MobilePlayerHome, {
      ...globalConfig,
      // Render the footer bar for real: the tests click its entries
      global: {...globalConfig.global, stubs: {...globalConfig.global.stubs, MobileNav: false}},
      props: {playerView},
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

  // After the initial selection is confirmed, the turn screen shows the own selection instead of the waiting sheet
  it('shows the own initial selection instead of the sheet once the setup is confirmed', async () => {
    const playerView = fakePlayerViewModel();
    playerView.pickedCorporationCard = [{name: 'Tharsis Republic'} as typeof playerView.pickedCorporationCard[number]];
    const wrapper = mountHome(playerView);
    await wrapper.find('.mb-nav-item--turn').trigger('click');
    expect(wrapper.classes()).to.include('mb-home--turn');
    expect((wrapper.vm as unknown as {sheetOpen: boolean}).sheetOpen).to.be.false;
    // Nothing to confirm: navigation stays, no task bar
    expect(wrapper.find('.mb-nav').exists()).to.be.true;
    expect(wrapper.find('.mb-taskbar').exists()).to.be.false;
  });

  // Server updates arrive in place (App.vue no longer remounts the view)
  it('keeps the chosen screen when the player view updates in place', async () => {
    const playerView = fakePlayerViewModel();
    const wrapper = mountHome(playerView);
    await wrapper.find('.mb-nav-item--log').trigger('click');

    await wrapper.setProps({playerView: {...playerView}});

    expect(wrapper.classes()).to.include('mb-home--log');
  });

  it('opens the action menu sheet when an update brings the own turn', async () => {
    const playerView = fakePlayerViewModel();
    const wrapper = mountHome(playerView);
    expect((wrapper.vm as unknown as {sheetOpen: boolean}).sheetOpen).to.be.false;

    await wrapper.setProps({playerView: {...playerView, waitingFor: {type: 'or', title: 'Take your first action', buttonLabel: 'Take action', options: [{type: 'option', title: 'Pass for this generation', buttonLabel: 'Pass'}]} as any}});

    expect((wrapper.vm as unknown as {sheetOpen: boolean}).sheetOpen).to.be.true;
    // The menu opens as a sheet over the current screen, not as the turn screen
    expect(wrapper.classes()).to.not.include('mb-home--turn');
  });
});
