import {GlyphName} from '@/client/components/mobile/mobileGlyphs';

/* Bildschirme der Mobil-Ansicht; `turn` ist die aktuelle Eingabe (Aktionsmenü, Karten kaufen, Startauswahl …). */
export const MOBILE_SCREENS = ['mars', 'hand', 'turn', 'players', 'log'] as const;
export type MobileScreen = typeof MOBILE_SCREENS[number];

/* Eintrag der Fußleiste; `turn` zeigt sein Symbol im runden Zug-Button. */
export type MobileNavItem = {
  screen: MobileScreen;
  label: string;
  icon: GlyphName;
};

export const MOBILE_NAV: ReadonlyArray<MobileNavItem> = [
  {screen: 'mars', label: 'Mars', icon: 'mars'},
  {screen: 'hand', label: 'Hand', icon: 'hand'},
  {screen: 'turn', label: 'Turn', icon: 'rocket'},
  {screen: 'players', label: 'Players', icon: 'players'},
  {screen: 'log', label: 'Log', icon: 'log'},
];
