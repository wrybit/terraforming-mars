import {expect} from 'chai';
import {nextTick} from 'vue';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import {REDUCED_EFFECTS_CLASS, startReducedEffects} from '@/client/utils/reducedEffects';

describe('reducedEffects', () => {
  afterEach(() => {
    PreferencesManager.INSTANCE.set('reduced_effects', false);
  });

  it('follows the setting with the class on <html>', async () => {
    startReducedEffects();
    PreferencesManager.INSTANCE.set('reduced_effects', true);
    await nextTick();
    expect(document.documentElement.classList.contains(REDUCED_EFFECTS_CLASS)).is.true;

    PreferencesManager.INSTANCE.set('reduced_effects', false);
    await nextTick();
    expect(document.documentElement.classList.contains(REDUCED_EFFECTS_CLASS)).is.false;
  });
});
