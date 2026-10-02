import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import LanguageSelectionDialog from '@/client/components/LanguageSelectionDialog.vue';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import {FakeLocalStorage} from './FakeLocalStorage';
import {ALL_LANGUAGES} from '@/common/constants';

describe('LanguageSelectionDialog', () => {
  let localStorage: FakeLocalStorage;

  beforeEach(() => {
    localStorage = new FakeLocalStorage();
    FakeLocalStorage.register(localStorage);
  });

  afterEach(() => {
    FakeLocalStorage.deregister(localStorage);
  });

  it('mounts without errors', () => {
    const wrapper = shallowMount(LanguageSelectionDialog, {
      ...globalConfig,
      props: {
        preferencesManager: PreferencesManager.INSTANCE,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('shows a tile per language and marks the current one', () => {
    const wrapper = shallowMount(LanguageSelectionDialog, {
      global: {...globalConfig.global, stubs: {...globalConfig.global.stubs, DialogFrame: false}},
      props: {
        preferencesManager: PreferencesManager.INSTANCE,
      },
    });
    expect(wrapper.findAll('.language-selection-tile')).has.length(ALL_LANGUAGES.length);
    expect(wrapper.find('.language-selection-tile.is-selected').text()).contains('English');
  });
});
