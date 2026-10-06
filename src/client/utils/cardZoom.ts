// Card size in the action box (zoom slider, CardZoomSlider.vue): one value for all tabs, remembered per browser.
// Applied as the CSS variable --card-zoom on the page root (card_zoom_slider.less).
import {reactive} from 'vue';
import {safeLocalStorage} from '@/client/utils/SafeLocalStorage';

export const CARD_ZOOM_MIN = 0.4;
export const CARD_ZOOM_MAX = 1.1;
export const CARD_ZOOM_DEFAULT = 1;
const STORAGE_KEY = 'card_zoom';
const CSS_VARIABLE = '--card-zoom';

function clamp(value: number): number {
  return Math.min(CARD_ZOOM_MAX, Math.max(CARD_ZOOM_MIN, value));
}

function stored(): number {
  const value = Number(safeLocalStorage.getItem(STORAGE_KEY));
  return Number.isFinite(value) && value > 0 ? clamp(value) : CARD_ZOOM_DEFAULT;
}

export const cardZoomState = reactive({zoom: stored()});

function apply(zoom: number): void {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty(CSS_VARIABLE, String(zoom));
  }
}

export function setCardZoom(zoom: number): void {
  cardZoomState.zoom = clamp(zoom);
  safeLocalStorage.setItem(STORAGE_KEY, String(cardZoomState.zoom));
  apply(cardZoomState.zoom);
}

apply(cardZoomState.zoom);
