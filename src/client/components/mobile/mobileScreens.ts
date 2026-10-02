import {GlyphName} from '@/client/components/mobile/mobileGlyphs';

/* Screens of the mobile view; `turn` is the current input (action menu, buying cards, initial selection …). */
export const MOBILE_SCREENS = ['mars', 'hand', 'turn', 'players', 'log'] as const;
export type MobileScreen = typeof MOBILE_SCREENS[number];

/* Footer bar entry; `turn` shows its icon in the round turn button. Labels only from existing translations. */
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

/* Spectators have neither hand nor turn: only Mars, players and log. */
export const SPECTATOR_NAV: ReadonlyArray<MobileNavItem> = MOBILE_NAV.filter((item) => item.screen !== 'hand' && item.screen !== 'turn');

/* Toggle in the players screen: player table or milestones & awards. */
export const PLAYER_SEGMENTS = [
  {key: 'players', labels: ['Players']},
  {key: 'ma', labels: ['Milestones', 'Awards']},
] as const;
export type PlayersSegment = typeof PLAYER_SEGMENTS[number]['key'];
