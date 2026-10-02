import {StatsTopKind} from './statsNavigation';

// Übersicht zeigt die Top 5 als Scroller, ein Klick auf den Titel öffnet die Top 20 als eigene Seite
export const SHOWCASE_SIZE = 5;
export const TOP_PAGE_SIZE = 20;

/** Überschriften (Englisch, werden übersetzt) – gleich auf Übersicht und Top-Seite. */
export const SHOWCASE_TITLES: Record<StatsTopKind, string> = {
  card: 'Most played project cards',
  corporation: 'Most played corporations',
};
