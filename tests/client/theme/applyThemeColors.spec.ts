import {expect} from 'chai';
import {afterEach, beforeEach, vi} from 'vitest';
import {applyTheme} from '@/client/theme/applyTheme';

// Dune brings the game stylesheet in its own colours (tools/themeColors.ts); Mars must keep the game's own one
describe('applyTheme colours', () => {
  let main: HTMLLinkElement;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({json: async () => ({})})));
    main = document.createElement('link');
    main.rel = 'stylesheet';
    main.setAttribute('href', 'styles.css');
    document.head.appendChild(main);
  });

  afterEach(async () => {
    vi.useRealTimers();
    await applyTheme('mars');
    document.querySelectorAll('link').forEach((link) => link.remove());
    vi.unstubAllGlobals();
  });

  it('loads the recoloured stylesheet for Dune and switches it off again for Mars', async () => {
    vi.useFakeTimers();
    const switching = applyTheme('dune');
    const dune = document.querySelector<HTMLLinkElement>('link[data-theme-colors="dune"]');
    expect(dune?.getAttribute('href')).eq('assets/themes/dune/styles.css');
    // Loaded: the game's own stylesheet goes off
    dune?.dispatchEvent(new Event('load'));
    await vi.runAllTimersAsync();
    await switching;
    expect(main.disabled).is.true;

    await applyTheme('mars');
    expect(main.disabled).is.false;
    expect(dune?.disabled).is.true;
  });

  it('switches loaded sheets by their own flag, never by the disabled attribute (that would reload them unstyled)', async () => {
    vi.useFakeTimers();
    const mainSheet = {disabled: false};
    Object.defineProperty(main, 'sheet', {get: () => mainSheet});
    const switching = applyTheme('dune');
    const dune = document.querySelector<HTMLLinkElement>('link[data-theme-colors="dune"]')!;
    const duneSheet = {disabled: false};
    Object.defineProperty(dune, 'sheet', {get: () => duneSheet});
    dune.dispatchEvent(new Event('load'));
    await vi.runAllTimersAsync();
    await switching;
    expect([mainSheet.disabled, duneSheet.disabled]).deep.eq([true, false]);

    await applyTheme('mars');
    expect([mainSheet.disabled, duneSheet.disabled]).deep.eq([false, true]);
    expect(main.hasAttribute('disabled') || dune.hasAttribute('disabled')).is.false;

    await applyTheme('dune');
    expect([mainSheet.disabled, duneSheet.disabled]).deep.eq([true, false]);
  });

  it('keeps the Mars colours when the Dune stylesheet does not arrive', async () => {
    vi.useFakeTimers();
    const switching = applyTheme('dune');
    await vi.runAllTimersAsync();
    await switching;
    // jsdom leaves "disabled" unset as long as nobody switched the sheet off
    expect(main.disabled === true).is.false;
  });
});
