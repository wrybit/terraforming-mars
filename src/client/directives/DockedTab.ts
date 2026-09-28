// Verbindet den aktiven Tab nahtlos mit seiner Box (.or-tab-panel, Stil in or_options_tabs.less).
// Tab und Box sind durchscheinend (Milchglas): Der obere Boxrand ließe sich nicht vom Tab überdecken,
// er schiene durch. Deshalb lässt die Box ihren oberen Rand unter dem aktiven Tab aus. Die Lage dieser
// Lücke kennt nur das DOM – die Direktive misst den Tab und gibt sie als CSS-Variablen an die Box.
// Nutzung: v-docked-tab auf der Box; die Tab-Leiste (.or-tabs) steht direkt davor oder im Element davor.
import {Directive} from 'vue';

// Attribut statt Klasse: Vue setzt gebundene Klassen bei jedem Rendern neu und würde eine eigene Klasse entfernen
export const DOCKED_TAB_ATTRIBUTE = 'data-docked-tab';
export const DOCKED_TAB_START = '--docked-tab-start';
export const DOCKED_TAB_END = '--docked-tab-end';
// Wert des Attributs, wenn der aktive Tab bündig an der rechten Kante der Box steht
export const DOCKED_TAB_RIGHT_EDGE = 'right-edge';

type Observed = {
  tabStrip: Element;
  observers: Array<{disconnect(): void}>;
};

const observedPanels = new WeakMap<HTMLElement, Observed>();

// Tab-Leiste direkt vor der Box – oder darin eingebettet (Log: "GEN:"-Titel und Leiste in .log-generations)
function findTabStrip(panel: HTMLElement): Element | undefined {
  const previous = panel.previousElementSibling;
  if (previous === null) {
    return undefined;
  }
  if (previous.classList.contains('or-tabs')) {
    return previous;
  }
  return previous.querySelector(':scope > .or-tabs') ?? undefined;
}

export function updateDockedTab(panel: HTMLElement): void {
  const activeTab = findTabStrip(panel)?.querySelector<HTMLElement>('.or-tab--active');
  if (activeTab === null || activeTab === undefined) {
    // Kein aktiver Tab (z. B. Aktionsmenü als Liste): voller Rahmen
    panel.removeAttribute(DOCKED_TAB_ATTRIBUTE);
    return;
  }
  const panelRect = panel.getBoundingClientRect();
  const panelLeft = panelRect.left;
  const tabRect = activeTab.getBoundingClientRect();
  // Unter den Seitenrändern des Tabs bleibt der Boxrand stehen, damit die Ecken lückenlos anschließen
  const tabBorder = parseFloat(getComputedStyle(activeTab).borderLeftWidth) || 0;
  panel.style.setProperty(DOCKED_TAB_START, `${Math.round(tabRect.left - panelLeft + tabBorder)}px`);
  panel.style.setProperty(DOCKED_TAB_END, `${Math.round(tabRect.right - panelLeft - tabBorder)}px`);
  // Tab bündig am rechten Rand (z. B. Beenden): dort entfällt die Rundung der Box, wie links beim ersten Tab
  const atRightEdge = Math.round(panelRect.right - tabRect.right) <= 0;
  panel.setAttribute(DOCKED_TAB_ATTRIBUTE, atRightEdge ? DOCKED_TAB_RIGHT_EDGE : '');
}

function stopObserving(panel: HTMLElement): void {
  observedPanels.get(panel)?.observers.forEach((observer) => observer.disconnect());
  observedPanels.delete(panel);
}

// Tabwechsel (Klasse) und Breitenänderungen (Schrift, Fenster) verschieben die Lücke
function observe(panel: HTMLElement): void {
  const tabStrip = findTabStrip(panel);
  if (observedPanels.get(panel)?.tabStrip === tabStrip) {
    return;
  }
  stopObserving(panel);
  if (tabStrip === undefined) {
    return;
  }
  const update = () => updateDockedTab(panel);
  const observers: Array<{disconnect(): void}> = [];
  if (typeof MutationObserver !== 'undefined') {
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(tabStrip, {subtree: true, childList: true, attributes: true, attributeFilter: ['class']});
    observers.push(mutationObserver);
  }
  // jsdom (Client-Tests) kennt keinen ResizeObserver
  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(tabStrip);
    resizeObserver.observe(panel);
    observers.push(resizeObserver);
  }
  observedPanels.set(panel, {tabStrip, observers});
}

export const vDockedTab: Directive<HTMLElement> = {
  mounted(panel) {
    observe(panel);
    updateDockedTab(panel);
  },
  updated(panel) {
    observe(panel);
    updateDockedTab(panel);
  },
  beforeUnmount(panel) {
    stopObserving(panel);
  },
};
