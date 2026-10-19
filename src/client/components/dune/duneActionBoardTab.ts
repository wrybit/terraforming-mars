import {DUNE_BOARD_TABS, DuneBoardTabId} from '@/client/components/boardTabs/boardTabs';
import {DUNE_TAB_ACTIONS} from './duneTabActions';
import {
  BAZAAR_ACTION_TITLE, JOIN_KANLY_TITLE, KANLY_SEND_TITLE, LEVY_TITLE, OPEN_KANLY_TITLE, SCHEMES_TITLE, WORM_TITLE,
} from '@/common/dune/duneActionTitles';

// Which Dune board tab (top right) belongs to an action tab of the menu: opening "Move spice" also opens the
// Smuggling board, "Make an offer" the CHOAM board … (Jens, 19 Oct 2026). Built from the buttons of the module tabs
// (duneTabActions.ts), so a new move needs no second entry; plus the moves without a button there.

const EXTRA_TITLES: ReadonlyArray<[string, DuneBoardTabId]> = [
  [BAZAAR_ACTION_TITLE, 'bazaar'],
  [WORM_TITLE, 'worm'],
  [LEVY_TITLE, 'worm'],
  [OPEN_KANLY_TITLE, 'kanly'],
  [JOIN_KANLY_TITLE, 'kanly'],
  [KANLY_SEND_TITLE, 'kanly'],
  [SCHEMES_TITLE, 'schemes'],
];

const BOARD_TAB_BY_TITLE: ReadonlyMap<string, DuneBoardTabId> = new Map([
  ...DUNE_BOARD_TABS.flatMap((tab) => DUNE_TAB_ACTIONS[tab].map((action): [string, DuneBoardTabId] => [action.path[0].title, tab])),
  ...EXTRA_TITLES,
]);

/** Dune board tab of an action by its English title key, or undefined (not a Dune move) */
export function duneBoardTabOf(titleKey: string): DuneBoardTabId | undefined {
  return BOARD_TAB_BY_TITLE.get(titleKey);
}
