// One shared wait for the web fonts. Reading document.fonts.ready brings the styles of the page up to date first: with
// every card asking on its own while a tab mounts, that cost one full style recalculation per card. All callers of
// one loading round share the promise; after it resolves the next caller asks the browser again (fonts loaded later).

let pending: Promise<void> | undefined;

/** Resolves once the fonts are loaded; at once where the browser has no font loading API (tests). */
export function whenFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || document.fonts === undefined) {
    return Promise.resolve();
  }
  if (pending === undefined) {
    pending = document.fonts.ready.then(() => {
      pending = undefined;
    });
  }
  return pending;
}
