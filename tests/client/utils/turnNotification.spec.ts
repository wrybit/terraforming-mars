import {expect} from 'chai';
import {afterEach, describe, it, vi} from 'vitest';
import {showTurnNotification} from '@/client/utils/turnNotification';

describe('showTurnNotification', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Ersetzt die Notification-API des Browsers; shown sammelt die angezeigten Mitteilungen
  function stubNotification(permission: 'default' | 'granted') {
    const shown: Array<{title: string, options: {icon?: string}}> = [];
    const requestPermission = vi.fn(() => Promise.resolve(permission));
    const fake = function(this: unknown, title: string, options: {icon?: string}) {
      shown.push({title, options});
    } as unknown as typeof Notification;
    Object.assign(fake, {permission, requestPermission});
    vi.stubGlobal('Notification', fake);
    return {shown, requestPermission};
  }

  function setPage(visibility: 'visible' | 'hidden', focused: boolean) {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(visibility);
    vi.spyOn(document, 'hasFocus').mockReturnValue(focused);
  }

  it('asks for permission first, even with the page in front', async () => {
    const {shown, requestPermission} = stubNotification('default');
    setPage('visible', true);
    expect(await showTurnNotification()).eq('no-permission');
    expect(requestPermission.mock.calls).has.length(1);
    expect(shown).is.empty;
  });

  it('stays quiet while the page is in front', async () => {
    const {shown} = stubNotification('granted');
    setPage('visible', true);
    expect(await showTurnNotification()).eq('page-in-front');
    expect(shown).is.empty;
  });

  it('shows the notification with the page in the background', async () => {
    const {shown} = stubNotification('granted');
    setPage('hidden', false);
    expect(await showTurnNotification('/icon.png')).eq('shown');
    expect(shown).has.length(1);
    expect(shown[0].options.icon).eq('/icon.png');
  });
});
