import {expect} from 'chai';
import {keysOfEvent} from '@/client/hotkeys/hotkeyEvents';

function press(code: string, key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', {code, key});
}

describe('hotkeyEvents', () => {
  const platform = Object.getOwnPropertyDescriptor(Navigator.prototype, 'platform');

  afterEach(() => {
    if (platform !== undefined) {
      Object.defineProperty(Navigator.prototype, 'platform', platform);
    }
  });

  it('reads single keys by position', () => {
    expect(keysOfEvent(press('KeyY', 'z'))).to.deep.equal(['KeyY']);
    expect(keysOfEvent(press('Numpad1', '1'))).to.deep.equal(['Digit1']);
  });

  it('swaps the key left of 1 and the <> key back on Mac ISO keyboards', () => {
    Object.defineProperty(Navigator.prototype, 'platform', {get: () => 'MacIntel', configurable: true});
    // The key left of 1 (^ on German keyboards) arrives as IntlBackslash on a Mac
    expect(keysOfEvent(press('IntlBackslash', 'Dead'))).to.deep.equal(['Backquote']);
    expect(keysOfEvent(press('Backquote', '<'))).to.deep.equal(['IntlBackslash']);
  });
});
