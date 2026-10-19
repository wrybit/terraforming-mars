import {DuneBoardTabId} from '@/client/components/boardTabs/boardTabs';
import {DuneMoveStep} from './duneMoves';

// Buttons of the module tabs: which move each one opens in its tab (titles of server/dune/*.ts) and why it may be
// greyed out. English texts, translated on display.

export type DuneTabAction = {
  label: string,
  /** Path to the move in the waiting input (duneMoves.ts); enabled while it is offered */
  path: ReadonlyArray<DuneMoveStep>,
  /** Shown under a greyed-out button */
  unavailable: string,
  /** The move has its own tab in the action menu (room for its input): the button opens that tab instead */
  actionTab?: true,
};

export const DUNE_TAB_ACTIONS: Readonly<Record<DuneBoardTabId, ReadonlyArray<DuneTabAction>>> = {
  // The wares themselves are the buttons (BazaarBoard.vue)
  bazaar: [],
  // Distance and levy are inputs of their own at the end of the generation, no buttons needed
  worm: [],
  // Open Kanly and send Sardaukar sit on the war field card (KanlyPanel.vue); recruiting is a standard project
  kanly: [],
  // Keeping an agenda is an input of its own once it is due (end of the generation), no button needed (Jens, 19 Oct 2026)
  schemes: [],
};
