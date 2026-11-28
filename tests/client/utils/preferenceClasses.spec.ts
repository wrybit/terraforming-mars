import {expect} from 'chai';
import {nextTick} from 'vue';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import {preferenceClass, startPreferenceClasses} from '@/client/utils/preferenceClasses';

describe('preferenceClasses', () => {
  afterEach(() => {
    PreferencesManager.INSTANCE.set('reduced_effects', false);
    PreferencesManager.INSTANCE.set('lang', 'en');
  });

  it('sets the setting classes on <body> without opening the settings', async () => {
    startPreferenceClasses();
    PreferencesManager.INSTANCE.set('reduced_effects', true);
    await nextTick();
    expect(document.body.classList.contains(preferenceClass('reduced_effects'))).is.true;

    PreferencesManager.INSTANCE.set('reduced_effects', false);
    await nextTick();
    expect(document.body.classList.contains(preferenceClass('reduced_effects'))).is.false;
  });

  it('keeps exactly one language class', async () => {
    startPreferenceClasses();
    PreferencesManager.INSTANCE.set('lang', 'de');
    await nextTick();
    PreferencesManager.INSTANCE.set('lang', 'fr');
    await nextTick();
    const languages = Array.from(document.body.classList).filter((name) => name.startsWith('language-'));
    expect(languages).to.deep.eq(['language-fr']);
  });
});
