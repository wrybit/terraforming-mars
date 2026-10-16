import {expect} from 'chai';
import {onHotkey} from '@/client/hotkeys/hotkeyDispatcher';
import {labelConfirmHotkey, tabConfirmHotkey} from '@/client/hotkeys/confirmHotkeys';

// jsdom lays nothing out: every element counts as visible for the dispatcher
const originalRects = HTMLElement.prototype.getClientRects;

function press(key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {key, cancelable: true});
  document.body.dispatchEvent(event);
  onHotkey(event);
  return event;
}

function button(hotkey: string): {element: HTMLButtonElement, clicks: () => number} {
  const element = document.createElement('button');
  element.setAttribute('data-hotkey', hotkey);
  let count = 0;
  element.addEventListener('click', () => count++);
  document.body.appendChild(element);
  return {element, clicks: () => count};
}

describe('hotkeyDispatcher', () => {
  beforeEach(() => {
    HTMLElement.prototype.getClientRects = () => [{}] as unknown as DOMRectList;
  });

  afterEach(() => {
    HTMLElement.prototype.getClientRects = originalRects;
    document.body.innerHTML = '';
  });

  it('sends binding steps with Enter and routine steps with Space', () => {
    const binding = button('confirm');
    const routine = button('proceed');
    expect(press('Enter').defaultPrevented).is.true;
    expect(binding.clicks()).to.equal(1);
    press(' ');
    expect(routine.clicks()).to.equal(1);
    expect(binding.clicks()).to.equal(1);
  });

  it('only shakes the button on the wrong key', () => {
    const binding = button('confirm');
    expect(press(' ').defaultPrevented).is.true;
    expect(binding.clicks()).to.equal(0);
    expect(binding.element.classList.contains('hotkey-wrong-key')).is.true;
  });

  it('knows which steps are binding', () => {
    expect(tabConfirmHotkey('tab-pass')).to.equal('confirm');
    expect(tabConfirmHotkey('tab-actions')).to.equal('proceed');
    expect(labelConfirmHotkey('Discard')).to.equal('confirm');
    expect(labelConfirmHotkey('Add resource')).to.equal('proceed');
  });
});
