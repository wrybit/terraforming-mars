import {StatsTopKind} from './statsNavigation';

// Overview shows the top 5 as a scroller, a click on the title opens the top 20 as its own page
export const SHOWCASE_SIZE = 5;
export const TOP_PAGE_SIZE = 20;

/** Headings (English, get translated) – same on overview and top page. */
export const SHOWCASE_TITLES: Record<StatsTopKind, string> = {
  card: 'Most played project cards',
  corporation: 'Most played corporations',
};
