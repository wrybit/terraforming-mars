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

  it('scrolls the main box of the active group with arrow up / down', () => {
    const group = document.createElement('div');
    group.setAttribute('data-hotkey-group', '');
    const list = document.createElement('div');
    list.style.overflowY = 'auto';
    Object.defineProperty(list, 'scrollHeight', {value: 1000});
    Object.defineProperty(list, 'clientHeight', {value: 300});
    const steps: Array<number> = [];
    list.scrollBy = ((options: {top?: number}) => steps.push(options.top ?? 0)) as typeof list.scrollBy;
    group.appendChild(list);
    document.body.appendChild(group);
    expect(press('ArrowDown').defaultPrevented).is.true;
    press('ArrowUp');
    expect(steps).has.length(2);
    expect(steps[0]).to.be.greaterThan(0);
    expect(steps[1]).to.be.lessThan(0);
  });

  it('knows which steps are binding', () => {
    expect(tabConfirmHotkey('tab-pass')).to.equal('confirm');
    expect(tabConfirmHotkey('tab-actions')).to.equal('proceed');
    expect(labelConfirmHotkey('Discard')).to.equal('confirm');
    expect(labelConfirmHotkey('Add resource')).to.equal('proceed');
  });
});
