// Drag handle targets (RowResizeHandle.vue) that change one element inside a card; the card height follows.
// Zoom: the content scales down/up to fit the chosen height (players table in the game view; victory point table and
// board on the results page), so nothing has to scroll. Height: the content gets the height itself (results charts).
// The parts of the card that do not change (heading, padding, border) are measured as "chrome".
import {HeightLimits, RowResizeTarget, clampHeight} from '@/client/utils/rowResize';

export type ContentZoom = {
  // Element that scales; its CSS reads the zoom from zoomVariable (set on the card, contract with the page's less file)
  content: HTMLElement;
  zoomVariable: string;
  // Below this the content becomes hard to read
  minZoom: number;
  // Largest zoom (default 1: never larger than the natural size – there would only be empty space)
  maxZoom?: () => number;
  // Also fix the card height (fixed layout of the game view, where flex would otherwise stretch the card)
  lockHeight?: boolean;
};

type NaturalSize = {height: number; chrome: number};

// Card height at zoom 1 and the part that does not scale
function naturalSize(card: HTMLElement, zoom: ContentZoom): NaturalSize {
  const savedHeight = card.style.height;
  const savedZoom = card.style.getPropertyValue(zoom.zoomVariable);
  card.style.height = '';
  card.style.setProperty(zoom.zoomVariable, '1');
  const height = card.getBoundingClientRect().height;
  const contentHeight = zoom.content.getBoundingClientRect().height;
  card.style.height = savedHeight;
  card.style.setProperty(zoom.zoomVariable, savedZoom);
  return {height, chrome: height - contentHeight};
}

function zoomLimits(size: NaturalSize, zoom: ContentZoom): HeightLimits {
  const content = size.height - size.chrome;
  const max = zoom.maxZoom?.() ?? 1;
  return {min: size.chrome + content * Math.min(zoom.minZoom, max), max: size.chrome + content * max};
}

export function contentZoomTarget(card: HTMLElement, zoom: ContentZoom): RowResizeTarget {
  return {
    current: () => card.getBoundingClientRect().height,
    limits: () => zoomLimits(naturalSize(card, zoom), zoom),
    apply(height) {
      if (height === undefined) {
        card.style.height = '';
        card.style.removeProperty(zoom.zoomVariable);
        return;
      }
      const size = naturalSize(card, zoom);
      const clamped = clampHeight(height, zoomLimits(size, zoom));
      const contentHeight = size.height - size.chrome;
      if (zoom.lockHeight === true) {
        card.style.height = `${clamped}px`;
      }
      card.style.setProperty(zoom.zoomVariable, String(contentHeight > 0 ? (clamped - size.chrome) / contentHeight : 1));
    },
  };
}

export type ContentHeight = {
  // Element whose height is set; its CSS reads it from heightVariable (set on the card)
  content: HTMLElement;
  heightVariable: string;
  // Limits of the content height in px
  limits: HeightLimits;
};

export function contentHeightTarget(card: HTMLElement, sized: ContentHeight): RowResizeTarget {
  const chrome = () => card.getBoundingClientRect().height - sized.content.getBoundingClientRect().height;
  return {
    current: () => card.getBoundingClientRect().height,
    limits: () => ({min: chrome() + sized.limits.min, max: chrome() + sized.limits.max}),
    apply(height) {
      if (height === undefined) {
        card.style.removeProperty(sized.heightVariable);
        return;
      }
      const contentHeight = clampHeight(height - chrome(), sized.limits);
      card.style.setProperty(sized.heightVariable, `${contentHeight}px`);
    },
  };
}
