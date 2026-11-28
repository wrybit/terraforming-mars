import {watchEffect} from 'vue';
import {getPreferences} from '@/client/utils/PreferencesManager';

// Class on <html> for the setting "Reduced effects on phones" (reduced_effects.less, effective in the mobile view only)
export const REDUCED_EFFECTS_CLASS = 'tm-reduced-effects';

let started = false;

/* Keeps the class in sync with the setting, also when it is switched in the settings dialog. */
export function startReducedEffects(): void {
  if (started || typeof document === 'undefined') {
    return;
  }
  started = true;
  watchEffect(() => {
    document.documentElement.classList.toggle(REDUCED_EFFECTS_CLASS, getPreferences().reduced_effects);
  });
}
