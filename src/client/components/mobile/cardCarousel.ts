/*
 * Karten-Karussell der Mobil-Ansicht ("Karte spielen"): die Karten liegen nebeneinander und werden
 * durchgewischt (mobile.less); die Karte in der Mitte ist die gewählte.
 */

/* Stand des Karussells für die Punkte darunter. */
export type CarouselState = {count: number, index: number};

// Standardprojekte liegen als Raster, nicht im Karussell (mobile.less, mobileFit.ts)
const LIST_SELECTOR = '.mb-screen--turn .payments_cont:not(:has(.card-standard-project))';
const ITEM_SELECTOR = ':scope > label.payments_cards';

function visibleList(root: HTMLElement): HTMLElement | undefined {
  return Array.from(root.querySelectorAll<HTMLElement>(LIST_SELECTOR)).find((list) => list.offsetWidth > 0);
}

function items(list: HTMLElement): Array<HTMLElement> {
  return Array.from(list.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
}

// Karte, deren Mitte der Mitte der Liste am nächsten ist
function centeredIndex(list: HTMLElement): number {
  const center = list.getBoundingClientRect().left + list.clientWidth / 2;
  let best = 0;
  let bestDistance = Infinity;
  items(list).forEach((item, index) => {
    const rect = item.getBoundingClientRect();
    const distance = Math.abs(rect.left + rect.width / 2 - center);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

// Mittige Karte auswählen (nur spielbare Karten haben ein Auswahlfeld)
function selectItem(item: HTMLElement | undefined): void {
  const input = item?.querySelector<HTMLInputElement>('input[type="radio"]');
  if (input !== null && input !== undefined && !input.checked) {
    input.click();
  }
}

/* Wischt zur Karte `index` im sichtbaren Karussell unter `root`. */
export function scrollCarouselTo(root: HTMLElement, index: number): void {
  const list = visibleList(root);
  const item = list === undefined ? undefined : items(list)[index];
  item?.scrollIntoView({behavior: 'smooth', inline: 'center', block: 'nearest'});
}

/* Hält `onChange` über das sichtbare Karussell unter `root` auf dem Laufenden (undefined: keins sichtbar). */
export function observeCardCarousel(root: HTMLElement, onChange: (state: CarouselState | undefined) => void): () => void {
  let list: HTMLElement | undefined;
  let timer = 0;
  const report = () => {
    if (list === undefined) {
      onChange(undefined);
      return;
    }
    onChange({count: items(list).length, index: centeredIndex(list)});
  };
  // Nach dem Wischen (Scrollen kommt zur Ruhe) die mittige Karte wählen
  const onScroll = () => {
    report();
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (list !== undefined) {
        selectItem(items(list)[centeredIndex(list)]);
      }
    }, 150);
  };
  const rescan = () => {
    const found = visibleList(root);
    if (found !== list) {
      list?.removeEventListener('scroll', onScroll);
      list = found;
      list?.addEventListener('scroll', onScroll, {passive: true});
    }
    report();
  };
  const mutations = new MutationObserver(rescan);
  mutations.observe(root, {childList: true, subtree: true, attributes: true, attributeFilter: ['style']});
  rescan();
  return () => {
    window.clearTimeout(timer);
    mutations.disconnect();
    list?.removeEventListener('scroll', onScroll);
  };
}
