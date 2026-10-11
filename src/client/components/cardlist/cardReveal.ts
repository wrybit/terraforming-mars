// Card list: cards appear only once everything they show is loaded (icons and pictures are CSS backgrounds that
// otherwise pop in one by one), then fade in from top to bottom, card after card (CardListCardGrid.vue).

// One card starts every REVEAL_STEP_MS, each fades for three steps: the third card starts while the first two are
// still fading in
export const REVEAL_STEP_MS = 60;
export const REVEAL_DURATION_MS = 3 * REVEAL_STEP_MS;
// Waiting for pictures never blocks longer than this (a missing image must not keep cards hidden)
export const LOAD_LIMIT_MS = 4000;

const PENDING_CLASS = 'card-reveal-pending';
const IN_CLASS = 'card-reveal-in';

const loaded = new Set<string>();
let pending: Array<{element: HTMLElement, resolve: () => void}> = [];
let flushScheduled = false;

// url("…") values of a computed background-image (several layers possible)
export function backgroundUrls(value: string): Array<string> {
  const urls: Array<string> = [];
  const pattern = /url\(["']?([^"')]+)["']?\)/g;
  for (let match = pattern.exec(value); match !== null; match = pattern.exec(value)) {
    urls.push(match[1]);
  }
  return urls;
}

// Every picture a card shows: backgrounds of all its elements (incl. ::before/::after) and <img>
function imageUrls(roots: ReadonlyArray<Element>): Set<string> {
  const urls = new Set<string>();
  for (const root of roots) {
    for (const element of [root, ...root.querySelectorAll('*')]) {
      for (const pseudo of [null, '::before', '::after']) {
        backgroundUrls(getComputedStyle(element, pseudo).backgroundImage).forEach((url) => urls.add(url));
      }
      if (element instanceof HTMLImageElement && element.currentSrc !== '') {
        urls.add(element.currentSrc);
      }
    }
  }
  return urls;
}

function loadImage(url: string): Promise<void> {
  if (loaded.has(url)) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const image = new Image();
    const done = () => {
      loaded.add(url);
      resolve();
    };
    image.onload = done;
    image.onerror = done;
    image.src = url;
  });
}

function waitForImages(roots: ReadonlyArray<Element>): Promise<void> {
  const all = Promise.all([...imageUrls(roots)].map(loadImage)).then(() => undefined);
  const fonts = document.fonts?.ready.then(() => undefined) ?? Promise.resolve();
  const limit = new Promise<void>((resolve) => setTimeout(resolve, LOAD_LIMIT_MS));
  return Promise.race([Promise.all([all, fonts]).then(() => undefined), limit]);
}

function reducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

async function flush(): Promise<void> {
  flushScheduled = false;
  const batch = pending;
  pending = [];
  // Top to bottom, left to right: row by row, card by card
  const positioned = batch.map((entry) => ({...entry, rect: entry.element.getBoundingClientRect()}))
    .sort((first, second) => first.rect.top - second.rect.top || first.rect.left - second.rect.left);
  await waitForImages(positioned.map((entry) => entry.element));
  const animate = !reducedMotion();
  let step = 0;
  for (const {element, rect, resolve} of positioned) {
    // Only cards on the screen fade in one after the other; those still below it simply appear
    const onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
    element.style.setProperty('--reveal-delay', `${animate && onScreen ? step++ * REVEAL_STEP_MS : 0}ms`);
    element.style.setProperty('--reveal-duration', `${REVEAL_DURATION_MS}ms`);
    element.classList.remove(PENDING_CLASS);
    if (animate && onScreen) {
      element.classList.add(IN_CLASS);
    }
    resolve();
  }
}

/**
 * Hides the freshly built card in `element` until its pictures are loaded, then fades it in with the other cards
 * built at the same moment. Resolves when its fade starts.
 */
export function revealWhenLoaded(element: HTMLElement): Promise<void> {
  element.classList.add(PENDING_CLASS);
  return new Promise((resolve) => {
    pending.push({element, resolve});
    if (!flushScheduled) {
      flushScheduled = true;
      // All cards that come into view together (one observer callback) form one sequence
      requestAnimationFrame(() => void flush());
    }
  });
}
