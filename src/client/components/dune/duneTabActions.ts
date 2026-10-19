import {DuneBoardTabId} from '@/client/components/boardTabs/boardTabs';
import {DuneMoveStep} from './duneMoves';
import {
  BLACK_MARKET_TITLE, BRIBE_TITLE, CHOAM_ACCEPT_TITLE, CHOAM_OFFER_TITLE, JOIN_KANLY_TITLE, OPEN_KANLY_TITLE,
  RECRUIT_TITLE, SCHEMES_TITLE, SMUGGLE_SPICE_TITLE,
} from '@/common/dune/duneActionTitles';

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
  kanly: [
    {label: 'Recruit Sardaukar', path: [{title: RECRUIT_TITLE}], unavailable: 'Not your turn, or not enough to pay'},
    {label: 'Open Kanly', path: [{title: OPEN_KANLY_TITLE}], unavailable: 'Needs a Sardaukar in your garrison and an opponent tile; one battle per generation'},
    {label: 'Send Sardaukar', path: [{title: JOIN_KANLY_TITLE}], unavailable: 'Only while a war field is open and you have Sardaukar'},
  ],
  schemes: [
    {label: 'Choose the agenda to keep', path: [{title: SCHEMES_TITLE}], unavailable: 'At the end of the generation once a player has 35 TR'},
  ],
  choam: [
    {label: 'Make an offer', path: [{title: CHOAM_OFFER_TITLE}], unavailable: 'Not your turn, or you already have an open offer', actionTab: true},
    {label: 'Accept a contract', path: [{title: CHOAM_ACCEPT_TITLE}], unavailable: 'No offer of another player you can pay'},
  ],
  smuggling: [
    {label: 'Move spice', path: [{title: SMUGGLE_SPICE_TITLE}], unavailable: 'Not your turn, or no spice and Solari to move it', actionTab: true},
    {label: 'Black market', path: [{title: BLACK_MARKET_TITLE}], unavailable: 'Not your turn, or not 2 of one resource', actionTab: true},
    {label: 'Bribe', path: [{title: BRIBE_TITLE}], unavailable: 'Only with suspicion above 0 and enough Solari'},
  ],
};
