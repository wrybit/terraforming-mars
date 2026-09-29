/* Bildschirme der Mobil-Ansicht; `turn` ist die aktuelle Eingabe (Aktionsmenü, Karten kaufen, Startauswahl …). */
export const MOBILE_SCREENS = ['mars', 'hand', 'turn', 'players', 'log'] as const;
export type MobileScreen = typeof MOBILE_SCREENS[number];

/* Eintrag der Fußleiste. */
export type MobileNavItem = {
  screen: MobileScreen;
  label: string;
  // Bild aus assets/; ohne Bild zeigt die Leiste den runden Zug-Button
  icon?: string;
};

export const MOBILE_NAV: ReadonlyArray<MobileNavItem> = [
  {screen: 'mars', label: 'Mars', icon: 'assets/sidebar/preferences_board.png'},
  {screen: 'hand', label: 'Hand', icon: 'assets/sidebar/preferences_cards.png'},
  {screen: 'turn', label: 'Turn'},
  {screen: 'players', label: 'Players', icon: 'assets/resources/tr.png'},
  {screen: 'log', label: 'Log', icon: 'assets/sidebar/preferences_actions.png'},
];
