// Split of a two-column page (game view: game left, board + log right; results page: results left, board, charts, log right)
// via a drag handle (ColumnResizeHandle.vue). The right column's share ends up as CSS variables on the column container
// (contract with player_home_columns.less / game_end_columns.less) and in the browser, so it survives a reload.
import {loadStoredNumber, saveStoredNumber} from '@/client/utils/layoutStorage';
import {ACTIVE_CLASS} from '@/client/utils/handleProximity';

// One split per page: where it is stored, which CSS variables carry it and its limits (percent of the right column)
export type ColumnSplit = {
  storageKey: string;
  mainVariable: string;
  sideVariable: string;
  defaultShare: number;
  // Limits so neither side becomes unusably narrow
  minShare: number;
  maxShare: number;
};

export const PLAYER_HOME_SPLIT: ColumnSplit = {
  storageKey: 'player_home_board_share',
  mainVariable: '--player-home-main-share',
  sideVariable: '--player-home-board-share',
  defaultShare: 40,
  minShare: 25,
  maxShare: 60,
};

// Default: the board at about its natural size (≈ 740px of a 1440px window), as before the handle existed
export const GAME_END_SPLIT: ColumnSplit = {
  storageKey: 'game_end_side_share',
  mainVariable: '--game-end-main-share',
  sideVariable: '--game-end-side-share',
  defaultShare: 54,
  minShare: 30,
  maxShare: 70,
};

// Step size for the arrow keys on the handle
export const KEYBOARD_STEP = 1;

export const clampShare = (split: ColumnSplit, share: number) => Math.min(split.maxShare, Math.max(split.minShare, share));

export function loadShare(split: ColumnSplit): number {
  const stored = loadStoredNumber(split.storageKey);
  return stored === undefined ? split.defaultShare : clampShare(split, stored);
}

function saveShare(split: ColumnSplit, share: number): void {
  saveStoredNumber(split.storageKey, share === split.defaultShare ? undefined : share);
}

export function applyShare(container: HTMLElement, split: ColumnSplit, share: number): void {
  container.style.setProperty(split.mainVariable, `${100 - share}fr`);
  container.style.setProperty(split.sideVariable, `${share}fr`);
}

// Height of the percentage display in the handle (column_resize_handle in player_home_columns.less): a bit below the
// pointer so the mouse pointer doesn't cover the values – or above it if there is no room left below
export const LABEL_Y_VARIABLE = '--resizer-label-y';
// Distance of the display centre from the pointer and half the display height
const LABEL_POINTER_OFFSET = 34;
const LABEL_HALF_HEIGHT = 16;

export function labelOffsetY(pointerY: number, handleHeight: number): number {
  const below = pointerY + LABEL_POINTER_OFFSET;
  return below + LABEL_HALF_HEIGHT <= handleHeight ? below : pointerY - LABEL_POINTER_OFFSET;
}

function trackPointerY(handle: HTMLElement, clientY: number): void {
  const rect = handle.getBoundingClientRect();
  handle.style.setProperty(LABEL_Y_VARIABLE, `${labelOffsetY(clientY - rect.top, rect.height)}px`);
}

// Right column share from the pointer position: everything right of the pointer belongs to the right column
export function shareFromPointer(split: ColumnSplit, containerRect: {left: number; width: number}, pointerX: number): number {
  const share = (containerRect.left + containerRect.width - pointerX) / containerRect.width * 100;
  return Math.round(clampShare(split, share) * 100) / 100;
}

// Dragging with mouse, pen or finger; calls onChange on every move, saves on release
export function startColumnResize(event: PointerEvent, container: HTMLElement, split: ColumnSplit, onChange: (share: number) => void): void {
  const handle = event.currentTarget as HTMLElement;
  handle.setPointerCapture(event.pointerId);
  handle.classList.add(ACTIVE_CLASS);
  // Don't select text while dragging
  event.preventDefault();
  let share = loadShare(split);
  trackPointerY(handle, event.clientY);

  const move = (moveEvent: PointerEvent) => {
    share = shareFromPointer(split, container.getBoundingClientRect(), moveEvent.clientX);
    trackPointerY(handle, moveEvent.clientY);
    applyShare(container, split, share);
    onChange(share);
  };
  const stop = () => {
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', stop);
    handle.removeEventListener('pointercancel', stop);
    handle.classList.remove(ACTIVE_CLASS);
    saveShare(split, share);
  };
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', stop);
  handle.addEventListener('pointercancel', stop);
}

// Display "left | right" with two decimal places (German comma); calculated in hundredths
// so both sides add up to exactly 100
export function shareLabel(sideShare: number): string {
  const side = Math.round(sideShare * 100);
  const format = (hundredths: number) => (hundredths / 100).toFixed(2).replace('.', ',') + '%';
  return `${format(10000 - side)} | ${format(side)}`;
}

// Sets a fixed share (keyboard, double click) and saves it
export function setShare(container: HTMLElement, split: ColumnSplit, share: number): number {
  const clamped = clampShare(split, share);
  applyShare(container, split, clamped);
  saveShare(split, clamped);
  return clamped;
}
