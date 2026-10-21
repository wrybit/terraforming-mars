// One keydown listener for all shortcuts of the game view. Buttons and tabs carry data-hotkey="<action id>"
// (AppButton's hotkey prop, tabs in OrOptions.vue); the dispatcher clicks the visible, enabled element of the
// pressed action. Because it looks up the binding on every key press, changed keys work immediately.
import {watch} from 'vue';
import {isTypingTarget} from '@/client/utils/typingTarget';
import {hotkeysAvailable} from '@/client/hotkeys/hotkeyAvailability';
import {hotkeyState, actionsForKeys} from '@/client/hotkeys/hotkeyStore';
import {keysOfEvent} from '@/client/hotkeys/hotkeyEvents';
import {activeHotkeyGroup, hotkeyItems, isVisible, refreshItemNumbers} from '@/client/hotkeys/hotkeyItems';
import {PICK_CODES} from '@/client/hotkeys/hotkeyActions';
import {ConfirmHotkey} from '@/client/hotkeys/confirmHotkeys';

// Open dialogs and overlays handle their own keys (Esc closes them); shortcuts of the page behind must not fire
const OVERLAY_SELECTOR = [
  '[aria-modal="true"]',
  'dialog[open]',
  '.popup-outer',
  '.game-menu-backdrop',
  '.space-confirm',
  '.card-panel--modal',
  '.other_player_panel',
].join(', ');

// Actions with their own listener elsewhere (LogPanel.vue rates AI decisions, HomeMixin.ts opens the help)
const HANDLED_ELSEWHERE = ['rate-ai', 'help'];

function openOverlay(): Element | undefined {
  const overlays = Array.from(document.querySelectorAll(OVERLAY_SELECTOR)).filter(isVisible);
  return overlays[overlays.length - 1];
}

function isEnabled(element: Element): boolean {
  return !(element instanceof HTMLButtonElement && element.disabled) && element.getAttribute('aria-disabled') !== 'true';
}

function hotkeyTarget(scope: Document | Element, id: string): HTMLElement | undefined {
  const candidates = Array.from(scope.querySelectorAll(`[data-hotkey="${id}"]`)).filter((element) => isVisible(element));
  const enabled = candidates.find(isEnabled);
  return enabled instanceof HTMLElement ? enabled : undefined;
}

// Several confirm buttons can be visible (e.g. a dialog next to the tab box): the one of the active group first
function confirmTarget(scope: Document | Element, id: string): HTMLElement | undefined {
  const group = activeHotkeyGroup(scope);
  const footer = group?.querySelector('.or-tab-footer') ?? undefined;
  return (footer !== undefined ? hotkeyTarget(footer, id) : undefined) ?? (group !== undefined ? hotkeyTarget(group, id) : undefined) ?? hotkeyTarget(scope, id);
}

const WRONG_KEY_CLASS = 'hotkey-wrong-key';
const WRONG_KEY_DURATION = 450;

// Enter on a Space button (or the other way round) sends nothing: the button shakes and its cap blinks
function signalWrongKey(button: HTMLElement): void {
  button.classList.remove(WRONG_KEY_CLASS);
  // Restart the animation when the wrong key is pressed again right away
  void button.offsetWidth;
  button.classList.add(WRONG_KEY_CLASS);
  window.setTimeout(() => button.classList.remove(WRONG_KEY_CLASS), WRONG_KEY_DURATION);
}

function submit(scope: Document | Element, id: ConfirmHotkey): boolean {
  const button = confirmTarget(scope, id);
  if (button !== undefined) {
    button.click();
    return true;
  }
  const other = confirmTarget(scope, id === 'confirm' ? 'proceed' : 'confirm');
  if (other !== undefined) {
    signalWrongKey(other);
    return true;
  }
  return false;
}

// A focused button or link reacts to Enter and Space by itself; tabs and selectable items do not count, otherwise
// a click on a tab or card would take the keys away from the button that sends the answer
function handlesKeyItself(target: EventTarget | null): boolean {
  if (target instanceof HTMLElement && (target.getAttribute('role') === 'tab' || target.closest('[data-hotkey-group] label') !== null)) {
    return false;
  }
  // Check boxes and radio buttons elsewhere (settings, create game) keep Space for switching
  const toggle = target instanceof HTMLInputElement && (target.type === 'checkbox' || target.type === 'radio');
  return toggle || target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement;
}

// Only the tabs of the action menu (OrOptions.vue marks its tab list); the board tabs use the same look.
// While "All cards" is open, the chosen action tab stays marked as well: the hand tab counts as the current one.
function scrolls(element: Element): boolean {
  if (!(element instanceof HTMLElement) || element.scrollHeight <= element.clientHeight + 1) {
    return false;
  }
  const overflow = window.getComputedStyle(element).overflowY;
  return overflow === 'auto' || overflow === 'scroll';
}

// Arrow up / down: one row of items (cards) further in the main box, or a good part of it without items. The box is
// the scrolling area inside the active group (the card list of a tab); without one, the column around the group.
function scrollingArea(group: Element): HTMLElement | undefined {
  const inside = [group, ...Array.from(group.querySelectorAll('*'))].filter(scrolls) as Array<HTMLElement>;
  if (inside.length > 0) {
    // The largest scrolling area is the main list (not a small text box inside a card)
    return inside.sort((first, second) => second.clientHeight - first.clientHeight)[0];
  }
  for (let element: HTMLElement | null = group.parentElement; element !== null; element = element.parentElement) {
    if (scrolls(element)) {
      return element;
    }
  }
  return undefined;
}

function scrollMainBox(direction: 1 | -1): boolean {
  const group = activeHotkeyGroup();
  const area = group !== undefined ? scrollingArea(group) : undefined;
  if (area === undefined) {
    return false;
  }
  const item = hotkeyItems(group)[0];
  const step = item !== undefined ? item.getBoundingClientRect().height + 16 : area.clientHeight * 0.6;
  area.scrollBy({top: direction * step, behavior: 'smooth'});
  startHoldScroll(area, direction);
  return true;
}

// Holding arrow up / down: after the first row step the box keeps gliding at an even speed until the key is released
const HOLD_DELAY_MS = 320;
const HOLD_SPEED_PX_PER_SECOND = 900;
let holdTimer: number | undefined;
let holdFrame: number | undefined;
let holdDirection: 1 | -1 | undefined;

function startHoldScroll(area: HTMLElement, direction: 1 | -1): void {
  stopHoldScroll();
  holdDirection = direction;
  holdTimer = window.setTimeout(() => {
    let last = performance.now();
    const glide = (now: number) => {
      area.scrollTop += direction * HOLD_SPEED_PX_PER_SECOND * (now - last) / 1000;
      last = now;
      holdFrame = window.requestAnimationFrame(glide);
    };
    holdFrame = window.requestAnimationFrame(glide);
  }, HOLD_DELAY_MS);
}

export function stopHoldScroll(): void {
  window.clearTimeout(holdTimer);
  if (holdFrame !== undefined) {
    window.cancelAnimationFrame(holdFrame);
  }
  holdTimer = undefined;
  holdFrame = undefined;
  holdDirection = undefined;
}

function onHotkeyRelease(event: KeyboardEvent): void {
  if (holdDirection !== undefined && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
    stopHoldScroll();
  }
}

// N / M: the view of the board below Mars / Moon one step back or on (tiles, bonus, coordinates)
// Controls an open dialog keeps outside its own element (BoardZoomModal.vue: the bar below the zoomed board)
const OVERLAY_CONTROLS_SELECTOR = '[data-overlay-controls]';

function stepBoardView(direction: 1 | -1, overlay?: Element): boolean {
  const scopes: Array<Document | Element> = overlay === undefined ? [document] :
    [overlay, ...Array.from(document.querySelectorAll(OVERLAY_CONTROLS_SELECTOR)).filter(isVisible)];
  const toggle = scopes.flatMap((scope) => Array.from(scope.querySelectorAll('.tile-view-toggle'))).find(isVisible);
  const options = toggle === undefined ? [] : Array.from(toggle.querySelectorAll<HTMLElement>('[role="radio"]'));
  if (options.length === 0) {
    return false;
  }
  const current = options.findIndex((option) => option.getAttribute('aria-checked') === 'true');
  options[(current + direction + options.length) % options.length].click();
  return true;
}

function cycleTab(direction: 1 | -1): boolean {
  const list = Array.from(document.querySelectorAll('[data-hotkey-tabs]')).find(isVisible);
  const tabs = list === undefined ? [] : Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]')).filter(isVisible);
  if (tabs.length === 0) {
    return false;
  }
  const selected = tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true');
  const hand = selected.find((tab) => tab.classList.contains('or-tab--hand'));
  const current = tabs.indexOf(hand ?? selected[0]);
  const next = tabs[(current + direction + tabs.length) % tabs.length];
  next.click();
  next.focus({preventScroll: true});
  return true;
}

function focusLogSearch(): boolean {
  const field = Array.from(document.querySelectorAll('.log-filter-bar input')).find(isVisible);
  if (field instanceof HTMLInputElement) {
    field.focus();
    return true;
  }
  return false;
}

function pickItem(index: number): boolean {
  const item = hotkeyItems(activeHotkeyGroup())[index];
  if (item === undefined) {
    return false;
  }
  item.click();
  return true;
}

function runAction(id: string): boolean {
  switch (id) {
  case 'previous-tab':
    return cycleTab(-1);
  case 'next-tab':
    return cycleTab(1);
  case 'board-view-previous':
    return stepBoardView(-1);
  case 'board-view-next':
    return stepBoardView(1);
  case 'log-search':
    return focusLogSearch();
  default: {
    const target = hotkeyTarget(document, id);
    target?.click();
    return target !== undefined;
  }
  }
}

export function onHotkey(event: KeyboardEvent): void {
  // Repeats of a held arrow key belong to the gliding scroll (startHoldScroll), the page must not scroll as well
  if (event.repeat && holdDirection !== undefined && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
    event.preventDefault();
    return;
  }
  if (!hotkeysAvailable.value || event.defaultPrevented || event.repeat || isTypingTarget(event.target)) {
    return;
  }
  const keys = keysOfEvent(event);
  if (keys === undefined) {
    return;
  }
  const overlay = openOverlay();
  const plain = keys.length === 1;
  let handled = false;
  const key = keys[keys.length - 1];
  if (plain && (key === 'Enter' || key === 'Space')) {
    if (handlesKeyItself(event.target)) {
      return;
    }
    handled = submit(overlay ?? document, key === 'Enter' ? 'confirm' : 'proceed');
  } else if (overlay !== undefined) {
    // Esc and everything else belongs to the dialog – except the board view switch inside it (zoomed board,
    // BoardZoomModal.vue): N and M step its own tile view, like on the page
    for (const id of actionsForKeys(keys)) {
      if (id === 'board-view-previous' || id === 'board-view-next') {
        handled = stepBoardView(id === 'board-view-next' ? 1 : -1, overlay);
        break;
      }
    }
    if (!handled) {
      return;
    }
  } else if (plain && (key === 'ArrowUp' || key === 'ArrowDown')) {
    handled = scrollMainBox(key === 'ArrowDown' ? 1 : -1);
  } else if (plain && key === 'Escape') {
    const button = confirmTarget(document, 'cancel');
    button?.click();
    handled = button !== undefined;
  } else if (plain && PICK_CODES.includes(key)) {
    handled = pickItem(PICK_CODES.indexOf(key));
  } else {
    // Shared keys (Dune and the other expansions): the first action that finds its target takes the key
    for (const id of actionsForKeys(keys)) {
      if (HANDLED_ELSEWHERE.includes(id)) {
        break;
      }
      if (runAction(id)) {
        handled = true;
        break;
      }
    }
  }
  if (handled) {
    event.preventDefault();
  }
}

let numberFrame: number | undefined;

function scheduleNumbers(): void {
  if (numberFrame !== undefined) {
    return;
  }
  numberFrame = window.requestAnimationFrame(() => {
    numberFrame = undefined;
    refreshItemNumbers(hotkeysAvailable.value && hotkeyState.showHints);
  });
}

let installed = false;

/** Called once by the app: key listener and the digits at the selectable items */
export function installHotkeys(): void {
  if (installed || typeof window === 'undefined') {
    return;
  }
  installed = true;
  window.addEventListener('keydown', onHotkey);
  window.addEventListener('keyup', onHotkeyRelease);
  window.addEventListener('blur', stopHoldScroll);
  // Digits follow every change of the page (tab switched, cards filtered …); adding our own caps triggers one more
  // pass that changes nothing
  new MutationObserver(scheduleNumbers).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'disabled', 'hidden', 'aria-selected', 'data-hotkey-group-active'],
    characterData: false,
  });
  window.addEventListener('resize', scheduleNumbers);
  watch([hotkeysAvailable, () => hotkeyState.showHints], scheduleNumbers);
  scheduleNumbers();
}

/** After a change of the "show keys" switch or the bindings */
export function refreshHotkeyHints(): void {
  if (installed) {
    scheduleNumbers();
  }
}
