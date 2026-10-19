import {DEFAULT_THEME, isTheme, Theme} from '@/common/theme/Theme';
import {safeLocalStorage} from '@/client/utils/SafeLocalStorage';
import {applyTheme} from '@/client/theme/applyTheme';

// The theme picked with the Mars/Dune switch (ThemeSwitch.vue). One choice for every page that offers the switch
// (create game, statistics, card list): picked on one page, it applies on all of them. A game keeps its own theme.
const STORAGE_KEY = 'theme_choice';

/** The last picked theme, Mars when none was picked yet (or storage is unavailable). */
export function chosenTheme(): Theme {
  const stored = safeLocalStorage.getItem(STORAGE_KEY);
  return isTheme(stored) ? stored : DEFAULT_THEME;
}

/** Remembers the theme without showing it (the create-game form shows it itself). */
export function rememberTheme(theme: Theme): void {
  safeLocalStorage.setItem(STORAGE_KEY, theme);
}

/** Remembers the theme and shows it (texts, pictures, background); resolves once its texts are loaded. */
export async function chooseTheme(theme: Theme): Promise<void> {
  rememberTheme(theme);
  await applyTheme(theme);
}

/** Shows the remembered theme, e.g. when a page with the switch opens. */
export function applyChosenTheme(): Promise<void> {
  return applyTheme(chosenTheme());
}
