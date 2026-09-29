// Aufteilung der Spieleransicht (links Spielgeschehen, rechts Brett + Log) per Ziehgriff.
// Der Anteil der rechten Spalte landet als CSS-Variablen am Spalten-Container (Vertrag mit player_home_columns.less)
// und im Browser, damit er das Neuladen überlebt.

export const MAIN_SHARE_VARIABLE = '--player-home-main-share';
export const BOARD_SHARE_VARIABLE = '--player-home-board-share';
export const DEFAULT_BOARD_SHARE = 40;
// Grenzen, damit keine Seite unbenutzbar schmal wird
export const MIN_BOARD_SHARE = 25;
export const MAX_BOARD_SHARE = 60;
// Schrittweite für die Pfeiltasten am Griff
export const KEYBOARD_STEP = 1;

const STORAGE_KEY = 'player_home_board_share';

export const clampBoardShare = (share: number) => Math.min(MAX_BOARD_SHARE, Math.max(MIN_BOARD_SHARE, share));

export function loadBoardShare(): number {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return stored > 0 ? clampBoardShare(stored) : DEFAULT_BOARD_SHARE;
  } catch {
    return DEFAULT_BOARD_SHARE;
  }
}

function saveBoardShare(share: number): void {
  try {
    if (share === DEFAULT_BOARD_SHARE) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, String(share));
    }
  } catch {
    // Ohne Speicher gilt die Aufteilung nur bis zum Neuladen
  }
}

export function applyBoardShare(container: HTMLElement, share: number): void {
  container.style.setProperty(MAIN_SHARE_VARIABLE, `${100 - share}fr`);
  container.style.setProperty(BOARD_SHARE_VARIABLE, `${share}fr`);
}

// Höhe der Prozent-Anzeige im Griff (player_home_columns.less): etwas unter dem Zeiger, damit der Mauszeiger
// die Werte nicht verdeckt – oder darüber, wenn unten kein Platz mehr ist
export const LABEL_Y_VARIABLE = '--resizer-label-y';
// Abstand der Anzeigenmitte vom Zeiger und halbe Anzeigenhöhe
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

// Anteil der rechten Spalte aus der Zeigerposition: alles rechts vom Zeiger gehört dem Brett
export function shareFromPointer(containerRect: {left: number; width: number}, pointerX: number): number {
  const share = (containerRect.left + containerRect.width - pointerX) / containerRect.width * 100;
  return Math.round(clampBoardShare(share) * 10) / 10;
}

// Ziehen mit Maus, Stift oder Finger; ruft onChange bei jeder Bewegung, speichert beim Loslassen
export function startColumnResize(event: PointerEvent, container: HTMLElement, onChange: (share: number) => void): void {
  const handle = event.currentTarget as HTMLElement;
  handle.setPointerCapture(event.pointerId);
  handle.classList.add('player-home-columns__resizer--dragging');
  // Beim Ziehen keinen Text markieren
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
    handle.classList.remove('player-home-columns__resizer--dragging');
    saveBoardShare(share);
  };
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', stop);
  handle.addEventListener('pointercancel', stop);
}

// Setzt einen festen Anteil (Tastatur, Doppelklick) und speichert ihn
export function setBoardShare(container: HTMLElement, share: number): number {
  const clamped = clampBoardShare(share);
  applyBoardShare(container, clamped);
  saveBoardShare(clamped);
  return clamped;
}
