// DevTools view mode: values only pretended in this browser – the game on the server stays as it is, nobody else sees
// anything, and there is no log line. For looking at layouts (scales, counters, other boards and themes).
import {ViewModel} from '@/common/models/PlayerModel';
import {BoardName} from '@/common/boards/BoardName';
import {Theme} from '@/common/theme/Theme';
import {devToolsState, remembered} from './devToolsState';

export type DevToolsView = {
  temperature?: number,
  oxygenLevel?: number,
  oceans?: number,
  venusScaleLevel?: number,
  boardName?: BoardName,
  theme?: Theme,
};

// Per browser tab: closing the tab ends the pretending
const STORAGE_KEY = 'tm-devtools-view';

export function loadDevToolsView(): DevToolsView {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}') as DevToolsView;
  } catch {
    return {};
  }
}

export function saveDevToolsView(view: DevToolsView): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(view));
  } catch {
    // Without storage the values last until the next reload
  }
}

export function clearDevToolsView(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing stored
  }
}

/** Writes the pretended values into a freshly loaded game, before it is shown (App.vue, WaitingFor.vue) */
export function applyDevToolsView(model: ViewModel): void {
  // Remembered DevTools count already: the admin check of the page load may still be under way
  if (!devToolsState.enabled && !remembered()) {
    return;
  }
  const view = loadDevToolsView();
  const game = model.game;
  if (view.temperature !== undefined) {
    game.temperature = view.temperature;
  }
  if (view.oxygenLevel !== undefined) {
    game.oxygenLevel = view.oxygenLevel;
  }
  if (view.oceans !== undefined) {
    game.oceans = view.oceans;
  }
  if (view.venusScaleLevel !== undefined) {
    game.venusScaleLevel = view.venusScaleLevel;
  }
  if (view.boardName !== undefined) {
    game.gameOptions.boardName = view.boardName;
  }
  if (view.theme !== undefined) {
    game.gameOptions.theme = view.theme;
  }
}
