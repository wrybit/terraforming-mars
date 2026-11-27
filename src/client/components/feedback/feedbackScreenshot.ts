// Screenshot of the visible page (without the feedback overlay itself) and the image that is sent:
// cropped, markers drawn in, small enough for the request limit.
// modern-screenshot is loaded only when the overlay opens (own chunk), not with the game
import {Box, MarkerDraft, isInsideCrop, toView} from './feedbackGeometry';

/** Elements left out of the screenshot: the overlay and menus that opened it */
export const SCREENSHOT_EXCLUDED_CLASSES = ['feedback-overlay', 'game-menu-dropdown', 'game-menu-backdrop'];
// Same purple as the buttons (@bg_action) so the drawn markers match the overlay
const MARKER_COLOR = 'rgb(87, 85, 217)';
const PIN_PATH = 'M15 39C15 39 2 23.5 2 14a13 13 0 0 1 26 0c0 9.5-13 25-13 25z';
const PIN_WIDTH = 30;
const PIN_HEIGHT = 40;
// Long edge of the sent image; enough to read card texts, small enough for the mail
const MAX_EDGE = 1920;
const JPEG_QUALITIES = [0.85, 0.75, 0.65, 0.55];

function excluded(node: Node): boolean {
  return node instanceof Element && SCREENSHOT_EXCLUDED_CLASSES.some((name) => node.classList.contains(name));
}

// Safari/Firefox decode SVG images inside the snapshot late; a few redraws catch them.
// modern-screenshot redraws once per embedded image with growing pauses (quadratic, many seconds on the game page),
// so the snapshot is drawn here with a fixed number of redraws instead
const REDRAW_DELAYS_MS = [80, 160, 240];
const NEEDS_REDRAW = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || /firefox/i.test(navigator.userAgent);

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const STICKY_SHIFT = 'data-feedback-sticky-shift';
const BACKGROUND_REPEAT = 'data-feedback-background-repeat';

/**
 * Safari loses background-repeat of layered backgrounds in the copy: a small corner gradient
 * (rounded tab panels) then tiles the whole panel. Noted per layer and set again on the copy.
 */
function noteBackgroundRepeat(element: HTMLElement, style: CSSStyleDeclaration, marked: Array<HTMLElement>): void {
  if (style.backgroundImage === 'none' || style.backgroundRepeat === 'repeat') {
    return;
  }
  const layers = style.backgroundSize.split(',').length;
  element.setAttribute(BACKGROUND_REPEAT, Array(layers).fill(style.backgroundRepeat).join(', '));
  marked.push(element);
}

/**
 * Sticky bars (e.g. the zoom bar above the cards, the action bar below them) would stick again in the copy,
 * where the lists are not scrolled but moved, and land in the wrong place. So they are noted with their current
 * distance to their place in the flow; the copy shows them unstuck at that distance.
 */
function markForSnapshot(): Array<HTMLElement> {
  const marked: Array<HTMLElement> = [];
  for (const element of document.body.querySelectorAll<HTMLElement>('*')) {
    const style = getComputedStyle(element);
    noteBackgroundRepeat(element, style, marked);
    if (style.position !== 'sticky') {
      continue;
    }
    const stuck = element.getBoundingClientRect();
    // Same box without sticking (same style as in the copy); restored before the next paint
    const {position, top, left} = element.style;
    element.style.position = 'relative';
    element.style.top = '0';
    element.style.left = '0';
    const unstuck = element.getBoundingClientRect();
    element.style.position = position;
    element.style.top = top;
    element.style.left = left;
    element.setAttribute(STICKY_SHIFT, `${stuck.left - unstuck.left}px ${stuck.top - unstuck.top}px`);
    marked.push(element);
  }
  return marked;
}

// Safari draws backdrop-filter inside the snapshot as a hatched layer; the space background behind the
// frosted panels is not in the snapshot anyway, so the blur has nothing to show
const SNAPSHOT_STYLE = '*, *::before, *::after { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }';

function prepareClone(clone: Node): void {
  if (!(clone instanceof Element)) {
    return;
  }
  const style = document.createElement('style');
  style.textContent = SNAPSHOT_STYLE;
  clone.appendChild(style);
  for (const element of clone.querySelectorAll<HTMLElement>(`[${STICKY_SHIFT}]`)) {
    element.style.setProperty('position', 'relative', 'important');
    element.style.setProperty('top', '0', 'important');
    element.style.setProperty('left', '0', 'important');
    // translate adds to the scroll transform modern-screenshot sets on the list content
    element.style.setProperty('translate', element.getAttribute(STICKY_SHIFT) ?? '', 'important');
  }
  for (const element of clone.querySelectorAll<HTMLElement>(`[${BACKGROUND_REPEAT}]`)) {
    element.style.setProperty('background-repeat', element.getAttribute(BACKGROUND_REPEAT) ?? '', 'important');
  }
}

/** The visible part of the page as it is right now */
export async function captureVisiblePage(): Promise<HTMLCanvasElement> {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const {createContext, destroyContext, domToForeignObjectSvg, loadMedia} = await import(/* webpackChunkName: "feedback-screenshot" */ 'modern-screenshot');
  const marked = markForSnapshot();
  // The body may be only as tall as the window (create game page) while the document scrolls further: then the copy
  // ended at the window height and a page scrolled down came out black. So the copy gets the full document height.
  const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  const context = await createContext(document.body, {
    scale,
    height,
    style: {height: `${height}px`},
    filter: (node) => !excluded(node),
    backgroundColor: '#000',
    // Scrolled lists (log, card hand) otherwise show their top instead of what is on screen
    features: {restoreScrollPosition: true, fixSvgXmlDecode: false},
    onCloneNode: prepareClone,
  });
  try {
    const svg = await domToForeignObjectSvg(context);
    // Same cleanup as modern-screenshot (control characters break the XML)
    const markup = new XMLSerializer().serializeToString(svg)
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\v\f\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/gu, '');
    const image = new Image();
    image.decoding = 'sync';
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    await loadMedia(image, {timeout: 30000});
    // Whole page first, exactly like modern-screenshot does (keeps the SVG sharp at the device scale)
    const page = document.createElement('canvas');
    page.width = Math.floor(context.width * scale);
    page.height = Math.floor(context.height * scale);
    const pageDrawing = page.getContext('2d');
    const draw = () => {
      pageDrawing?.clearRect(0, 0, page.width, page.height);
      pageDrawing?.drawImage(image, 0, 0, page.width, page.height);
    };
    draw();
    if (NEEDS_REDRAW) {
      for (const delay of REDRAW_DELAYS_MS) {
        await wait(delay);
        draw();
      }
    }
    // The page may be taller than the window: keep the part that was on screen
    const visible = document.createElement('canvas');
    visible.width = Math.round(window.innerWidth * scale);
    visible.height = Math.round(window.innerHeight * scale);
    visible.getContext('2d')?.drawImage(page,
      window.scrollX * scale, window.scrollY * scale, visible.width, visible.height,
      0, 0, visible.width, visible.height);
    return visible;
  } finally {
    destroyContext(context);
    marked.forEach((element) => {
      element.removeAttribute(STICKY_SHIFT);
      element.removeAttribute(BACKGROUND_REPEAT);
    });
  }
}

function drawMarker(context: CanvasRenderingContext2D, marker: MarkerDraft, crop: Box, width: number, height: number): void {
  const view = toView(marker, crop);
  const x = view.x / 100 * width;
  const y = view.y / 100 * height;
  // Markers scale with the image so they stay readable on large screenshots
  // 0.72: same size as on the screen (FeedbackScreenshot.vue, PIN_SCALE)
  const size = Math.max(1, Math.max(width, height) / 1400) * 0.72;
  context.save();
  context.font = `bold ${13 * size}px Ubuntu, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  if (marker.kind === 'pin') {
    context.translate(x - PIN_WIDTH / 2 * size, y - PIN_HEIGHT * size);
    context.scale(size, size);
    const pin = new Path2D(PIN_PATH);
    context.fillStyle = MARKER_COLOR;
    context.fill(pin);
    context.lineWidth = 2;
    context.strokeStyle = '#fff';
    context.stroke(pin);
    context.fillStyle = '#fff';
    context.font = 'bold 13px Ubuntu, sans-serif';
    context.fillText(String(marker.number), PIN_WIDTH / 2, 14.5);
  } else {
    const areaWidth = marker.width / crop.width * width;
    const areaHeight = marker.height / crop.height * height;
    context.fillStyle = 'rgba(87, 85, 217, 0.16)';
    context.fillRect(x, y, areaWidth, areaHeight);
    context.lineWidth = 2 * size;
    context.strokeStyle = MARKER_COLOR;
    context.strokeRect(x, y, areaWidth, areaHeight);
    const badge = 25 * size;
    context.fillStyle = MARKER_COLOR;
    context.fillRect(x - badge / 2, y - badge / 2, badge, badge);
    context.fillStyle = '#fff';
    context.fillText(String(marker.number), x, y);
  }
  context.restore();
}

/** JPEG data URL of the cropped screenshot with all markers inside the crop, at most maxLength characters */
export function renderReportImage(source: HTMLCanvasElement, crop: Box, markers: ReadonlyArray<MarkerDraft>, maxLength: number): string {
  const sourceX = crop.x / 100 * source.width;
  const sourceY = crop.y / 100 * source.height;
  const sourceWidth = crop.width / 100 * source.width;
  const sourceHeight = crop.height / 100 * source.height;
  let scale = Math.min(1, MAX_EDGE / Math.max(sourceWidth, sourceHeight));
  for (;;) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext('2d');
    if (context === null) {
      return '';
    }
    context.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    for (const marker of markers.filter((marker) => isInsideCrop(marker, crop))) {
      drawMarker(context, marker, crop, canvas.width, canvas.height);
    }
    for (const quality of JPEG_QUALITIES) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= maxLength) {
        return dataUrl;
      }
    }
    if (canvas.width < 400) {
      return '';
    }
    scale *= 0.75;
  }
}
