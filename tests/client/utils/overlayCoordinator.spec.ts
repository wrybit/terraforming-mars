import {expect} from 'chai';
import {closeOtherOverlays, registerOverlay} from '@/client/utils/overlayCoordinator';

describe('overlayCoordinator', () => {
  it('schließt beim Öffnen alle Overlays mit anderem Schlüssel', () => {
    const closed: Array<string> = [];
    const unregisterA = registerOverlay('a', () => closed.push('a'));
    const unregisterB1 = registerOverlay('b', () => closed.push('b1'));
    const unregisterB2 = registerOverlay('b', () => closed.push('b2'));

    closeOtherOverlays('b');
    expect(closed).deep.eq(['a']);

    closeOtherOverlays('c');
    expect(closed).deep.eq(['a', 'a', 'b1', 'b2']);

    unregisterA();
    unregisterB1();
    unregisterB2();
  });

  it('abgemeldete Overlays werden nicht mehr geschlossen', () => {
    const closed: Array<string> = [];
    const unregister = registerOverlay('a', () => closed.push('a'));
    unregister();
    closeOtherOverlays('b');
    expect(closed).deep.eq([]);
  });
});
