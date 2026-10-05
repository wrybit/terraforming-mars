// Split of the player view (game on the left, board + log on the right) via a drag handle.
// The right column's share ends up as CSS variables on the column container (contract with player_home_columns.less)
// and in the browser, so it survives a reload.
import {loadStoredNumber, saveStoredNumber} from '@/client/utils/layoutStorage';
import {ACTIVE_CLASS} from '@/client/utils/handleProximity';

export const MAIN_SHARE_VARIABLE = '--player-home-main-share';
export const BOARD_SHARE_VARIABLE = '--player-home-board-share';
export const DEFAULT_BOARD_SHARE = 40;
// Limits so neither side becomes unusably narrow
export const MIN_BOARD_SHARE = 25;
export const MAX_BOARD_SHARE = 60;
// Step size for the arrow keys on the handle
export const KEYBOARD_STEP = 1;

const STORAGE_KEY = 'player_home_board_share';

export const clampBoardShare = (share: number) => Math.min(MAX_BOARD_SHARE, Math.max(MIN_BOARD_SHARE, share));

export function loadBoardShare(): number {
  const stored = loadStoredNumber(STORAGE_KEY);
  return stored === undefined ? DEFAULT_BOARD_SHARE : clampBoardShare(stored);
}

function saveBoardShare(share: number): void {
  saveStoredNumber(STORAGE_KEY, share === DEFAULT_BOARD_SHARE ? undefined : share);
}

export function applyBoardShare(container: HTMLElement, share: number): void {
  container.style.setProperty(MAIN_SHARE_VARIABLE, `${100 - share}fr`);
  container.style.setProperty(BOARD_SHARE_VARIABLE, `${share}fr`);
}

// Height of the percentage display in the handle (player_home_columns.less): a bit below the pointer so the mouse pointer
// doesn't cover the values – or above it if there is no room left below
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

// Right column share from the pointer position: everything right of the pointer belongs to the board
export function shareFromPointer(containerRect: {left: number; width: number}, pointerX: number): number {
  const share = (containerRect.left + containerRect.width - pointerX) / containerRect.width * 100;
  return Math.round(clampBoardShare(share) * 100) / 100;
}

// Dragging with mouse, pen or finger; calls onChange on every move, saves on release
export function startColumnResize(event: PointerEvent, container: HTMLElement, onChange: (share: number) => void): void {
  const handle = event.currentTarget as HTMLElement;
  handle.setPointerCapture(event.pointerId);
  handle.classList.add(ACTIVE_CLASS);
  // Don't select text while dragging
  event.preventDefault();
  let share = loadBoardShare();
  trackPointerY(handle, event.clientY);

  const move = (moveEvent: PointerEvent) => {
    share = shareFromPointer(container.getBoundingClientRect(), moveEvent.clientX);
    trackPointerY(handle, moveEvent.clientY);
    applyBoardShare(container, share);
    onChange(share);
  };
  const stop = () => {
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', stop);
    handle.removeEventListener('pointercancel', stop);
    handle.classList.remove(ACTIVE_CLASS);
    saveBoardShare(share);
  };
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', stop);
  handle.addEventListener('pointercancel', stop);
}

// Display "left | right" with two decimal places (German comma); calculated in hundredths
// so both sides add up to exactly 100
export function shareLabel(boardShare: number): string {
  const board = Math.round(boardShare * 100);
  const format = (hundredths: number) => (hundredths / 100).toFixed(2).replace('.', ',') + '%';
  return `${format(10000 - board)} | ${format(board)}`;
}

// Sets a fixed share (keyboard, double click) and saves it
export function setBoardShare(container: HTMLElement, share: number): number {
  const clamped = clampBoardShare(share);
  applyBoardShare(container, clamped);
  saveBoardShare(clamped);
  return clamped;
}
