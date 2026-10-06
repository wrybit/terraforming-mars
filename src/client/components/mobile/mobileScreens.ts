import {GlyphName} from '@/client/components/mobile/mobileGlyphs';
import {FlashArea} from '@/client/utils/changeFlashKeys';
import {MILESTONES_AWARDS_LABELS} from '@/client/components/milestoneAwardTable/milestonesAwardsLabel';

/* Screens of the mobile view; `turn` is the current input (action menu, buying cards, initial selection …). */
export const MOBILE_SCREENS = ['mars', 'hand', 'turn', 'players', 'log'] as const;
export type MobileScreen = typeof MOBILE_SCREENS[number];

/* Footer bar entry; `turn` shows its icon in the round turn button. Labels only from existing translations. */
export type MobileNavItem = {
  screen: MobileScreen;
  label: string;
  icon: GlyphName;
  // Parts of the game shown on this screen: the entry blinks for other players' changes there (ChangeFlashTab.ts)
  flashAreas: ReadonlyArray<FlashArea>;
};

export const MOBILE_NAV: ReadonlyArray<MobileNavItem> = [
  {screen: 'mars', label: 'Mars', icon: 'mars', flashAreas: ['mars', 'moon', 'colonies', 'turmoil']},
  {screen: 'hand', label: 'All cards', icon: 'hand', flashAreas: []},
  {screen: 'turn', label: 'Actions', icon: 'rocket', flashAreas: []},
  {screen: 'players', label: 'Players', icon: 'players', flashAreas: ['players', 'milestonesAwards']},
  {screen: 'log', label: 'Game log', icon: 'log', flashAreas: []},
];

/* Spectators have neither hand nor turn: only Mars, players and log. */
export const SPECTATOR_NAV: ReadonlyArray<MobileNavItem> = MOBILE_NAV.filter((item) => item.screen !== 'hand' && item.screen !== 'turn');

/* Toggle in the players screen: player table or milestones & awards. */
export const PLAYER_SEGMENTS = [
  {key: 'players', labels: ['Players'], flashAreas: ['players']},
  {key: 'ma', labels: MILESTONES_AWARDS_LABELS, flashAreas: ['milestonesAwards']},
] as const satisfies ReadonlyArray<{key: string, labels: ReadonlyArray<string>, flashAreas: ReadonlyArray<FlashArea>}>;
export type PlayersSegment = typeof PLAYER_SEGMENTS[number]['key'];
