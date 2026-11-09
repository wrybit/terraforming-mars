import {expect} from 'chai';
import {afterEach} from 'vitest';
import {appRootUrl, chosenTheme, rememberTheme} from '@/client/theme/themeChoice';

describe('themeChoice', () => {
  afterEach(() => {
    document.querySelector('base')?.remove();
    window.history.replaceState(null, '', '/');
  });

  it('shows Mars without a world in the address', () => {
    window.history.replaceState(null, '', '/stats');
    expect(chosenTheme()).eq('mars');
    expect(appRootUrl().pathname).eq('/');
  });

  it('reads the world of the address', () => {
    window.history.replaceState(null, '', '/dune/stats');
    expect(chosenTheme()).eq('dune');
    expect(appRootUrl().pathname).eq('/');
    window.history.replaceState(null, '', '/mars/');
    expect(chosenTheme()).eq('mars');
  });

  it('moves the page into the other world, address and base', () => {
    window.history.replaceState(null, '', '/lobby/room/ab12-Runde?seat=x');
    const base = document.createElement('base');
    base.setAttribute('href', '../../');
    document.head.appendChild(base);
    rememberTheme('dune');
    expect(window.location.pathname + window.location.search).eq('/dune/lobby/room/ab12-Runde?seat=x');
    expect(chosenTheme()).eq('dune');
    rememberTheme('mars');
    expect(window.location.pathname).eq('/mars/lobby/room/ab12-Runde');
    expect(new URL('api/lobby', document.baseURI).pathname).eq('/mars/api/lobby');
  });
});
