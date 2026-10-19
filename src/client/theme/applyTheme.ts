import {ref} from 'vue';
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
// Reactive, so views that depend on the theme (e.g. the app background) follow a switch without a reload
const active = ref<Theme>('mars');

export function activeTheme(): Theme {
  return active.value;
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

// Themes with their own colours: the whole game stylesheet recoloured (src/themes/<theme>/colors.json,
// tools/themeColors.ts). It stands in for styles.css while the theme is shown, so the cascade stays as on Mars.
const RECOLORED_THEMES: ReadonlyArray<Theme> = ['dune'];
const STYLESHEET_WAIT_MS = 4000;

function mainStylesheet(): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>('link[rel="stylesheet"][href="styles.css"]');
}

// Switches a stylesheet on or off without throwing it away: the disabled attribute of a <link> drops the parsed sheet,
// and switching it back on loads and parses it anew – for a few frames the page has no styles at all (on the theme
// switch the planet flashed in the wrong half). The sheet's own flag keeps it ready.
function setStylesheetEnabled(link: HTMLLinkElement, enabled: boolean): void {
  if (link.sheet !== null) {
    link.sheet.disabled = !enabled;
  } else {
    link.disabled = !enabled;
  }
}

function isStylesheetEnabled(link: HTMLLinkElement): boolean {
  return link.sheet !== null ? !link.sheet.disabled : !link.disabled;
}

/** Shows the stylesheet of the theme (or the game's own); resolves once it is loaded, so nothing flashes in Mars colours. */
function useColors(theme: Theme): Promise<void> {
  const main = mainStylesheet();
  const others = Array.from(document.querySelectorAll<HTMLLinkElement>('link[data-theme-colors]'));
  // Without the game's stylesheet (tests) there is nothing to stand in for
  if (main === null || !RECOLORED_THEMES.includes(theme)) {
    // The game's own first, then the theme's off: there is always one complete stylesheet in effect
    if (main !== null) {
      setStylesheetEnabled(main, true);
    }
    others.forEach((link) => setStylesheetEnabled(link, false));
    return Promise.resolve();
  }
  const existing = others.find((link) => link.dataset.themeColors === theme);
  if (existing !== undefined && existing.sheet !== null) {
    setStylesheetEnabled(existing, true);
    others.filter((link) => link !== existing).forEach((link) => setStylesheetEnabled(link, false));
    setStylesheetEnabled(main, false);
    return Promise.resolve();
  }
  others.forEach((link) => setStylesheetEnabled(link, false));
  const link = existing ?? document.createElement('link');
  link.rel = 'stylesheet';
  link.dataset.themeColors = theme;
  link.href = `assets/themes/${theme}/styles.css`;
  return new Promise<void>((resolve) => {
    // The game's stylesheet goes off only once the theme's is there; until then (or on a load error) Mars colours.
    // A slow load never holds up the switch: the colours follow when they arrive
    link.onload = () => {
      setStylesheetEnabled(main, !isStylesheetEnabled(link));
      resolve();
    };
    link.onerror = () => resolve();
    setTimeout(resolve, STYLESHEET_WAIT_MS);
    if (existing === undefined) {
      // Right after the game's stylesheet: theme.css (pictures) still comes later and wins
      main.after(link);
    } else {
      setStylesheetEnabled(link, true);
    }
  });
}

/** Switches texts and pictures to the theme of the game; resolves once its texts are loaded. */
export async function applyTheme(theme: Theme | undefined): Promise<void> {
  const wanted: Theme = theme ?? 'mars';
  if (wanted === active.value) {
    return;
  }
  const colors = useColors(wanted);
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
  await colors;
  document.documentElement.classList.toggle('theme-dune', wanted === 'dune');
  active.value = wanted;
}
