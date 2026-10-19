// Titles of the choices of the Dune modules. The server sets them (server/dune/*.ts), the module tabs of the client
// find the moves by them (client/components/dune/duneTabActions.ts) – one place, so both sides stay in step.
// English, translated on display.

export const DUNE_ACTIONS_TITLE = 'Dune expansion actions';

export const BAZAAR_ACTION_TITLE = 'Bazaar: buy a ware';
/** Title of each ware of the bazaar action; the ware name is its first value */
export const BAZAAR_WARE_TITLE = '${0} for ${1} M€';
/**
 * Purchase of one ware as its own action tab, shown only after a tap on that ware in the bazaar (Jens, 19 Oct 2026);
 * the ware name is its first value, so the tap finds its tab (actionTabRequest.ts)
 */
export const BAZAAR_BUY_TITLE = 'Bazaar: buy ${0} for ${1} M€';

export const WORM_TITLE = 'Shai-Hulud: how far does the worm move?';
export const LEVY_TITLE = 'Shai-Hulud: pay resources worth ${0}';

export const RECRUIT_TITLE = 'Recruit Sardaukar';
export const OPEN_KANLY_TITLE = 'Open Kanly: choose the war field';
export const JOIN_KANLY_TITLE = 'Send Sardaukar to the war field';
/** Amount right after opening the Kanly: how many Sardaukar march out first */
export const KANLY_SEND_TITLE = 'Sardaukar to send to the war field';
export const KANLY_SEND_BUTTON = 'Send';

export const SCHEMES_TITLE = 'House schemes: which agenda do you keep?';

export const CHOAM_OFFER_TITLE = 'CHOAM: make an offer';
export const CHOAM_ACCEPT_TITLE = 'CHOAM: accept a contract';

/** Moving spice and the black market in one trade, one action tab named like the module (Jens, 19 Oct 2026) */
export const SMUGGLE_TITLE = 'Smuggling';
/** Former separate moves, now the one smuggling trade */
export const SMUGGLE_SPICE_TITLE = SMUGGLE_TITLE;
export const BLACK_MARKET_TITLE = SMUGGLE_TITLE;
export const BRIBE_TITLE = 'Bribe the officials: ${0} M€, suspicion −1';
