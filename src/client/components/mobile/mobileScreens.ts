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

/* Zuschauer haben weder Hand noch Zug: nur Mars, Spieler und Log. */
export const SPECTATOR_NAV: ReadonlyArray<MobileNavItem> = MOBILE_NAV.filter((item) => item.screen !== 'hand' && item.screen !== 'turn');

/* Umschalter im Spieler-Bildschirm: Spielertabelle bzw. Meilensteine & Auszeichnungen. */
export const PLAYER_SEGMENTS = [
  {key: 'players', labels: ['Players']},
  {key: 'ma', labels: ['Milestones', 'Awards']},
] as const;
export type PlayersSegment = typeof PLAYER_SEGMENTS[number]['key'];
