import {DEFAULT_THEME, Theme} from '@/common/theme/Theme';
import {themeOfPath} from '@/common/theme/themeUrl';
import {applyTheme} from '@/client/theme/applyTheme';

// The theme picked with the Mars/Dune switch (ThemeSwitch.vue). The address carries it (common/theme/themeUrl.ts):
// /dune/lobby shows Dune, /mars/lobby and /lobby show Mars. Every relative link of the page stays in that world,
// so one choice holds for every page that offers the switch (lobby, create game, statistics, card list).
// A game keeps its own theme.

/** Folder of the app's pages including the world (https://host/dune/), whatever page is open */
function pageFolder(): URL {
  // Pages below lobby/ carry a base back up to the app (LobbySubPage.ts); the others lie in the app folder
  return new URL('.', document.baseURI);
}

function themeOfFolder(folder: URL): Theme | undefined {
  const segments = folder.pathname.split('/').filter((segment) => segment !== '');
  return themeOfPath(segments[segments.length - 1] ?? '');
}

/** Folder of the app without the world (https://host/), also when the app runs behind a path prefix */
export function appRootUrl(): URL {
  const folder = pageFolder();
  return themeOfFolder(folder) === undefined ? folder : new URL('../', folder);
}

/** The theme of the address, Mars when it names none. */
export function chosenTheme(): Theme {
  return themeOfFolder(pageFolder()) ?? DEFAULT_THEME;
}

/** Puts the theme into the address without showing it (the create-game form shows it itself). */
export function rememberTheme(theme: Theme): void {
  const folder = pageFolder();
  if (themeOfFolder(folder) === theme) {
    return;
  }
  const target = new URL(theme + '/', appRootUrl());
  // The rest of the address (lobby/create, stats, …) moves along into the other world
  const rest = window.location.pathname.slice(folder.pathname.length);
  window.history.replaceState(window.history.state, '', target.pathname + rest + window.location.search + window.location.hash);
  // A base (lobby pages) was resolved against the old address: point it at the new world, so relative links follow
  const base = document.querySelector('base');
  if (base !== null) {
    base.setAttribute('href', target.href);
  }
}

/** Puts the theme into the address and shows it (texts, pictures, background); resolves once its texts are loaded. */
export async function chooseTheme(theme: Theme): Promise<void> {
  rememberTheme(theme);
  await applyTheme(theme);
}

/** Shows the theme of the address, e.g. when a page with the switch opens. */
export function applyChosenTheme(): Promise<void> {
  return applyTheme(chosenTheme());
}
