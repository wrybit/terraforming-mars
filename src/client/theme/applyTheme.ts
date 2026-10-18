import {Theme} from '@/common/theme/Theme';
import {getPreferences} from '@/client/utils/PreferencesManager';

declare global {
  interface Window {
    /** Texts of the active theme (English key → text in the current language), checked before _translations */
    _themeTranslations: {[key: string]: string} | undefined;
  }
}

// The theme of the open game (common/theme/Theme.ts). Only what is shown changes: the class on <html> swaps
// icons and pictures (assets/themes/<theme>/theme.css), the theme texts replace the Mars wording.
let active: Theme = 'mars';

export function activeTheme(): Theme {
  return active;
}

function ensureStylesheet(theme: Theme): void {
  const id = `theme-stylesheet-${theme}`;
  if (document.getElementById(id) !== null) {
    return;
  }
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `assets/themes/${theme}/theme.css`;
  document.head.appendChild(link);
}

/** Switches texts and pictures to the theme of the game; resolves once its texts are loaded. */
export async function applyTheme(theme: Theme | undefined): Promise<void> {
  const wanted: Theme = theme ?? 'mars';
  if (wanted === active) {
    return;
  }
  if (wanted === 'mars') {
    window._themeTranslations = undefined;
  } else {
    ensureStylesheet(wanted);
    try {
      const lang = getPreferences().lang;
      window._themeTranslations = await fetch(`assets/themes/${wanted}/texts/${lang}.json`).then((res) => res.json());
    } catch (err) {
      // Without the theme texts the game stays fully playable, only with the Mars wording
      console.warn(`Cannot load the texts of the ${wanted} theme. See network for details.`);
      window._themeTranslations = undefined;
    }
  }
  document.documentElement.classList.toggle('theme-dune', wanted === 'dune');
  active = wanted;
}
