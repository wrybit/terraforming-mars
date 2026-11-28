import {watchEffect} from 'vue';
import {getPreferences, Preference, PreferencesManager} from '@/client/utils/PreferencesManager';
import {mobileLayout} from '@/client/utils/mobileLayout';
import {watchForSlowFrames} from '@/client/utils/slowDevice';

// Settings that change the look work through classes on <body> (preferences.less, reduced_effects.less,
// language_hacks.less). They used to be set only while the settings dialog was rendered, so after a reload
// they were missing until the dialog was opened once. Now they follow the settings from the start.

const PREFERENCE_CLASS_PREFIX = 'preferences_';
const LANGUAGE_CLASS_PREFIX = 'language-';

export function preferenceClass(preference: Preference): string {
  return PREFERENCE_CLASS_PREFIX + preference;
}

function syncClasses(target: HTMLElement): void {
  const values = getPreferences();
  for (const preference of Object.keys(values) as Array<Preference>) {
    if (preference !== 'lang') {
      target.classList.toggle(preferenceClass(preference), values[preference] === true);
    }
  }
  const languageClass = LANGUAGE_CLASS_PREFIX + values.lang;
  for (const existing of Array.from(target.classList)) {
    if (existing.startsWith(LANGUAGE_CLASS_PREFIX) && existing !== languageClass) {
      target.classList.remove(existing);
    }
  }
  target.classList.add(languageClass);
}

let started = false;

/* Called once by the app: keeps the classes in sync and watches for a slow phone. */
export function startPreferenceClasses(): void {
  if (started || typeof document === 'undefined') {
    return;
  }
  started = true;
  watchEffect(() => syncClasses(document.body));
  // Slow phone detected while scrolling: reduced effects, unless the person chose otherwise in the settings
  const manager = PreferencesManager.INSTANCE;
  watchForSlowFrames(
    () => mobileLayout.value && !manager.isChosen('reduced_effects') && !getPreferences().reduced_effects,
    () => manager.setDefault('reduced_effects', true),
  );
}
