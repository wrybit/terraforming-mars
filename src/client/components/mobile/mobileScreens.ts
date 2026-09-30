import {GlyphName} from '@/client/components/mobile/mobileGlyphs';

/* Bildschirme der Mobil-Ansicht; `turn` ist die aktuelle Eingabe (Aktionsmenü, Karten kaufen, Startauswahl …). */
export const MOBILE_SCREENS = ['mars', 'hand', 'turn', 'players', 'log'] as const;
export type MobileScreen = typeof MOBILE_SCREENS[number];

/* Eintrag der Fußleiste; `turn` zeigt sein Symbol im runden Zug-Button. Beschriftungen nur aus vorhandenen Übersetzungen. */
export type MobileNavItem = {
  screen: MobileScreen;
  label: string;
  icon: GlyphName;
};

export const MOBILE_NAV: ReadonlyArray<MobileNavItem> = [
  {screen: 'mars', label: 'Mars', icon: 'mars'},
  {screen: 'hand', label: 'Cards In Hand', icon: 'hand'},
  {screen: 'turn', label: 'Actions', icon: 'rocket'},
  {screen: 'players', label: 'Players', icon: 'players'},
  {screen: 'log', label: 'Game log', icon: 'log'},
];
