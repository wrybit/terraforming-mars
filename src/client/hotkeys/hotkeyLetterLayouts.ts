// Letter layouts for browsers without the keyboard layout API (Firefox, Safari): a guess from the browser language
// (or the game language) first, replaced by the layout that the first letter press reveals, remembered on this device. The player can also
// pick the layout by hand in the shortcut dialog. Only the labels depend on this; letters are bound by position.
import {computed, shallowRef} from 'vue';
import {safeLocalStorage} from '@/client/utils/SafeLocalStorage';
import {getPreferences} from '@/client/utils/PreferencesManager';

export const LETTER_LAYOUTS = ['qwerty', 'qwertz', 'azerty'] as const;
export type LetterLayout = typeof LETTER_LAYOUTS[number];
export type LetterLayoutChoice = LetterLayout | 'auto';

const STORAGE_KEY = 'hotkeys-keyboard-layout';

// Keys whose character differs from US QWERTY; every other letter key shows the letter its code is named after
const DIFFERENCES: Record<LetterLayout, Readonly<Record<string, string>>> = {
  qwerty: {},
  qwertz: {KeyY: 'Z', KeyZ: 'Y'},
  azerty: {KeyQ: 'A', KeyA: 'Q', KeyW: 'Z', KeyZ: 'W', KeyM: ',', Semicolon: 'M'},
};

/** Character on a letter position in this layout; undefined for keys outside the letter block */
export function letterAt(code: string, layout: LetterLayout): string | undefined {
  const different = DIFFERENCES[layout][code];
  if (different !== undefined) {
    return different;
  }
  return /^Key[A-Z]$/.test(code) ? code.slice('Key'.length) : undefined;
}

// Usual keyboard per language (BCP 47 tag of the browser). Regions first: French Canada types on QWERTY, French
// and German Switzerland on QWERTZ.
const REGION_LAYOUTS: Readonly<Record<string, LetterLayout>> = {'fr-ca': 'qwerty', 'fr-ch': 'qwertz', 'de-ch': 'qwertz', 'nl-be': 'azerty'};
const LANGUAGE_LAYOUTS: Readonly<Record<string, LetterLayout>> = {fr: 'azerty', de: 'qwertz', hu: 'qwertz', cs: 'qwertz', sk: 'qwertz', sl: 'qwertz', hr: 'qwertz'};

/** Likely layout: the first of these languages with a layout other than QWERTY; QWERTY where none has one */
export function guessLetterLayout(languages: ReadonlyArray<string>): LetterLayout {
  for (const language of languages) {
    const tag = language.toLowerCase();
    const layout = REGION_LAYOUTS[tag] ?? LANGUAGE_LAYOUTS[tag.split('-')[0]];
    if (layout !== undefined) {
      return layout;
    }
  }
  return 'qwerty';
}

/** The only layout that puts this letter on this position; undefined when the key tells nothing (same in all) */
export function layoutOfKey(code: string, key: string): LetterLayout | undefined {
  if (!/^[a-zA-Z]$/.test(key)) {
    return undefined;
  }
  const matching = LETTER_LAYOUTS.filter((layout) => letterAt(code, layout) === key.toUpperCase());
  return matching.length === 1 ? matching[0] : undefined;
}

// Stored as "qwertz" (picked by hand) or "auto:azerty" (recognized from a key press)
function storedChoice(): LetterLayoutChoice {
  const raw = safeLocalStorage.getItem(STORAGE_KEY);
  return LETTER_LAYOUTS.find((layout) => layout === raw) ?? 'auto';
}

function storedRecognized(): LetterLayout | undefined {
  const raw = safeLocalStorage.getItem(STORAGE_KEY);
  const layout = raw?.startsWith('auto:') === true ? raw.slice('auto:'.length) : undefined;
  return LETTER_LAYOUTS.find((candidate) => candidate === layout);
}

/** Layout picked by hand in the dialog, or 'auto' */
export const letterLayoutChoice = shallowRef<LetterLayoutChoice>(storedChoice());
const recognizedLayout = shallowRef<LetterLayout | undefined>(storedRecognized());

// Only the first browser language: further ones are often languages the player reads, not the keyboard. The game
// language comes next, so an English browser in a German game keeps the QWERTZ of the drawn keyboard.
function guessLanguages(): ReadonlyArray<string> {
  const browser = typeof navigator !== 'undefined' ? navigator.languages?.[0] ?? navigator.language : undefined;
  return [...(browser !== undefined ? [browser] : []), getPreferences().lang];
}

/** Layout the labels use where the browser does not tell the real one */
export const letterLayout = computed<LetterLayout>(() => {
  if (letterLayoutChoice.value !== 'auto') {
    return letterLayoutChoice.value;
  }
  return recognizedLayout.value ?? guessLetterLayout(guessLanguages());
});

/** True while the letters are only a guess from the browser language */
export const letterLayoutGuessed = computed(() => letterLayoutChoice.value === 'auto' && recognizedLayout.value === undefined);

export function setLetterLayoutChoice(choice: LetterLayoutChoice): void {
  letterLayoutChoice.value = choice;
  if (choice === 'auto') {
    recognizedLayout.value = undefined;
    safeLocalStorage.removeItem(STORAGE_KEY);
  } else {
    safeLocalStorage.setItem(STORAGE_KEY, choice);
  }
}

/** Learns the layout from a letter press: one key such as A, Q, W, Y, Z or M tells all letters */
export function recognizeLetterLayout(code: string, key: string): void {
  const layout = layoutOfKey(code, key);
  if (layout === undefined || layout === recognizedLayout.value) {
    return;
  }
  recognizedLayout.value = layout;
  if (letterLayoutChoice.value === 'auto') {
    safeLocalStorage.setItem(STORAGE_KEY, 'auto:' + layout);
  }
}

/** Only for tests: forget the choice and the recognized layout */
export function resetLetterLayout(): void {
  letterLayoutChoice.value = 'auto';
  recognizedLayout.value = undefined;
  safeLocalStorage.removeItem(STORAGE_KEY);
}
