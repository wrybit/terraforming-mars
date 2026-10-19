import {DuneBoardTabId} from '@/client/components/boardTabs/boardTabs';
import {DuneMoveStep} from './duneMoves';
import {
  BLACK_MARKET_TITLE, BRIBE_TITLE, CHOAM_ACCEPT_TITLE, CHOAM_OFFER_TITLE, JOIN_KANLY_TITLE, LEVY_TITLE, OPEN_KANLY_TITLE,
  RECRUIT_TITLE, SCHEMES_TITLE, SMUGGLE_SPICE_TITLE, WORM_TITLE,
} from '@/common/dune/duneActionTitles';

// Buttons of the module tabs: which move each one opens in its tab (titles of server/dune/*.ts) and why it may be
// greyed out. English texts, translated on display.

export type DuneTabAction = {
  label: string,
  /** Path to the move in the waiting input (duneMoves.ts); enabled while it is offered */
  path: ReadonlyArray<DuneMoveStep>,
  /** Shown under a greyed-out button */
  unavailable: string,
};

export const DUNE_TAB_ACTIONS: Readonly<Record<DuneBoardTabId, ReadonlyArray<DuneTabAction>>> = {
  // The wares themselves are the buttons (BazaarBoard.vue)
  bazaar: [],
  worm: [
    {label: 'Choose the distance', path: [{title: WORM_TITLE}], unavailable: 'At the end of the generation, for the player with the least TR'},
    {label: 'Pay the levy', path: [{title: LEVY_TITLE}], unavailable: 'Only when the worm crosses one of your tiles'},
  ],
  kanly: [
    {label: 'Recruit Sardaukar', path: [{title: RECRUIT_TITLE}], unavailable: 'Not your turn, or not enough to pay'},
    {label: 'Open Kanly', path: [{title: OPEN_KANLY_TITLE}], unavailable: 'Needs a Sardaukar in your garrison and an opponent tile; one battle per generation'},
    {label: 'Send Sardaukar', path: [{title: JOIN_KANLY_TITLE}], unavailable: 'Only while a war field is open and you have Sardaukar'},
  ],
  schemes: [
    {label: 'Choose the agenda to keep', path: [{title: SCHEMES_TITLE}], unavailable: 'At the end of the generation once a player has 35 TR'},
  ],
  choam: [
    {label: 'Make an offer', path: [{title: CHOAM_OFFER_TITLE}], unavailable: 'Not your turn, or you already have an open offer'},
    {label: 'Accept a contract', path: [{title: CHOAM_ACCEPT_TITLE}], unavailable: 'No offer of another player you can pay'},
  ],
  smuggling: [
    {label: 'Move spice', path: [{title: SMUGGLE_SPICE_TITLE}], unavailable: 'Not your turn, or no spice and Solari to move it'},
    {label: 'Black market', path: [{title: BLACK_MARKET_TITLE}], unavailable: 'Not your turn, or not 2 of one resource'},
    {label: 'Bribe', path: [{title: BRIBE_TITLE}], unavailable: 'Only with suspicion above 0 and enough Solari'},
  ],
};
