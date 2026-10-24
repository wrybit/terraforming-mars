// Every keyboard shortcut of the game view: id, group in the help dialog, English label (translated like all texts)
// and the default keys. Locked shortcuts are fixed (Enter, Space, Esc, digits …) and cannot be changed in the help dialog.

/**
 * Keys of a shortcut: a single key is a physical position (KeyboardEvent.code, e.g. 'KeyQ', 'Slash'); a combination
 * is 'Mod' (⌘ on Mac, Ctrl elsewhere) plus a character (KeyboardEvent.key, letters uppercase), like the system does
 */
export type HotkeyKeys = ReadonlyArray<string>;

/**
 * Groups of the help dialog in their order; the tab groups follow the tab bar: always there, ending the turn,
 * depending on the situation, expansions
 */
export type HotkeyGroup = 'general' | 'selection' | 'tabs' | 'tabs-default' | 'tabs-turn-end' | 'tabs-context' | 'tabs-expansion' | 'board';

/** Expansion a tab only exists with; its shortcut is only listed in games with it */
export type HotkeyExpansion = 'turmoil' | 'colonies' | 'moon' | 'pathfinders' | 'deltaProject' | 'dune';

/**
 * Dune is played on its own (Arrakis, no other expansion): its tabs take the keys of the other expansions again
 * (Jens, 19 Oct 2026). Two such shortcuts never meet in one game, so the same key is no conflict.
 */
export const STANDALONE_EXPANSION: HotkeyExpansion = 'dune';

export type HotkeyAction = {
  id: string;
  group: HotkeyGroup;
  label: string;
  /** Second line of the label in the list, set apart on purpose instead of a random wrap */
  detail?: string;
  /** Short label on the drawn keyboard, when the label is too long for a key */
  short?: string;
  /** Default keys; single keys by position, so the tab keys lie side by side on every layout */
  keys: HotkeyKeys;
  /** Fixed key, shown in the dialog but not editable */
  locked?: boolean;
  /** Color of the label in the dialog, like the icon tabs pass on (green) and end generation (red) */
  tone?: 'success' | 'danger';
  expansion?: HotkeyExpansion;
};

export const HOTKEY_ACTIONS: ReadonlyArray<HotkeyAction> = [
  {id: 'setup-menu', group: 'general', label: 'Setup menu', short: 'Menu', keys: ['Backquote']},
  {id: 'log-search', group: 'general', label: 'Search the log', short: 'Log', keys: ['Slash']},
  {id: 'undo', group: 'general', label: 'Undo', keys: ['Mod', 'Z']},
  {id: 'rate-ai', group: 'general', label: 'Rate AI decision', short: 'AI', keys: ['KeyI']},
  {id: 'pick', group: 'selection', label: 'Choose card / option', short: 'Choose', keys: ['1', '…', '0'], locked: true},
  {id: 'select-all', group: 'selection', label: 'Select all', short: 'All', keys: ['Mod', 'A']},
  {id: 'amount', group: 'selection', label: 'Change amount', short: 'Amount', keys: ['ArrowLeft', 'ArrowRight'], locked: true},
  {id: 'scroll', group: 'selection', label: 'Scroll through the cards', short: 'Scroll', keys: ['ArrowUp', 'ArrowDown'], locked: true},
  {id: 'confirm', group: 'selection', label: 'Binding', detail: '(costs / ends)', keys: ['Enter'], locked: true},
  {id: 'proceed', group: 'selection', label: 'Continue', detail: '(normal steps)', keys: ['Space'], locked: true},
  {id: 'cancel', group: 'selection', label: 'Cancel / discard', detail: 'Close / no', short: 'Cancel', keys: ['Escape'], locked: true},
  {id: 'previous-tab', group: 'tabs', label: 'Previous tab', short: 'Tab', keys: ['Comma']},
  {id: 'next-tab', group: 'tabs', label: 'Next tab', short: 'Tab', keys: ['Period']},
  {id: 'tab-hand', group: 'tabs-default', label: 'All cards', short: 'Cards', keys: ['KeyQ']},
  {id: 'tab-actions', group: 'tabs-default', label: 'Actions', keys: ['KeyW']},
  {id: 'tab-projects', group: 'tabs-default', label: 'Projects', keys: ['KeyE']},
  {id: 'tab-award', group: 'tabs-default', label: 'Award', keys: ['KeyR']},
  {id: 'tab-standard', group: 'tabs-default', label: 'Standard', keys: ['KeyT']},
  {id: 'tab-sell', group: 'tabs-default', label: 'Sell', keys: ['KeyY']},
  {id: 'tab-pass', group: 'tabs-turn-end', label: 'Pass on', keys: ['KeyZ'], tone: 'success'},
  {id: 'tab-end', group: 'tabs-turn-end', label: 'End generation', short: 'End', keys: ['KeyX'], tone: 'danger'},
  {id: 'tab-corporation', group: 'tabs-context', label: 'Corporation action', short: 'Corporation', keys: ['KeyA']},
  {id: 'tab-milestone', group: 'tabs-context', label: 'Milestone', keys: ['KeyS']},
  {id: 'tab-place', group: 'tabs-context', label: 'Place', keys: ['KeyD']},
  {id: 'tab-temperature', group: 'tabs-context', label: 'Temperature', keys: ['KeyF']},
  {id: 'tab-delegate', group: 'tabs-expansion', label: 'Delegate', keys: ['KeyG'], expansion: 'turmoil'},
  {id: 'tab-trade', group: 'tabs-expansion', label: 'Trade', keys: ['KeyH'], expansion: 'colonies'},
  // Dune action tabs continue the context row like Delegate and Trade (Jens, 19 Oct 2026)
  {id: 'tab-choam', group: 'tabs-expansion', label: 'CHOAM', keys: ['KeyG'], expansion: 'dune'},
  // Board tabs above the right column, in their order on the right-hand home row; the view of Mars / Moon below
  {id: 'board-mars', group: 'board', label: 'Mars', keys: ['KeyJ']},
  {id: 'board-moon', group: 'board', label: 'Moon', keys: ['KeyK'], expansion: 'moon'},
  {id: 'board-colonies', group: 'board', label: 'Colonies', keys: ['KeyL'], expansion: 'colonies'},
  {id: 'board-turmoil', group: 'board', label: 'Turmoil', keys: ['Semicolon'], expansion: 'turmoil'},
  {id: 'board-paths', group: 'board', label: 'Planets', keys: ['Quote'], expansion: 'pathfinders'},
  {id: 'board-delta', group: 'board', label: 'Delta', keys: ['Backslash'], expansion: 'deltaProject'},
  // Dune module tabs (boardTabs.ts DUNE_BOARD_TABS) right after Arrakis on the same row
  {id: 'board-bazaar', group: 'board', label: 'Bazaar', keys: ['KeyK'], expansion: 'dune'},
  {id: 'board-worm', group: 'board', label: 'Shai-Hulud', keys: ['KeyL'], expansion: 'dune'},
  {id: 'board-kanly', group: 'board', label: 'Kanly', keys: ['Semicolon'], expansion: 'dune'},
  {id: 'board-schemes', group: 'board', label: 'Schemes', keys: ['Quote'], expansion: 'dune'},
  {id: 'board-view-previous', group: 'board', label: 'Previous board view', short: 'Board view', keys: ['KeyN']},
  {id: 'board-view-next', group: 'board', label: 'Next board view', short: 'Board view', keys: ['KeyM']},
];

/** Shortcuts outside the game view, fixed and not listed in the help dialog */
export const FIXED_HOTKEYS: Readonly<Record<string, HotkeyKeys>> = {
  'create-game': ['Mod', 'Enter'],
  'help': ['?'],
};

/** Digits that choose the items of the active group: 1 … 9, then 0 for the tenth */
export const PICK_DIGITS: ReadonlyArray<string> = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
/** The same digits as positions (KeyboardEvent.code): digits without Shift also on AZERTY */
export const PICK_CODES: ReadonlyArray<string> = PICK_DIGITS.map((digit) => 'Digit' + digit);

export function findHotkeyAction(id: string): HotkeyAction | undefined {
  return HOTKEY_ACTIONS.find((action) => action.id === id);
}

/** Whether the action belongs to a game with these expansions (undefined: outside a game, everything) */
export function isActionShown(action: HotkeyAction, expansions?: ReadonlyArray<string>): boolean {
  return action.expansion === undefined || expansions === undefined || expansions.includes(action.expansion);
}

/** Expansions switched on in a game, for the shortcut dialog; Dune comes by its modules, not as an expansion flag */
export function gameExpansions(expansions: Readonly<Record<string, boolean>>, hasDune = false): Array<string> {
  const switchedOn = Object.keys(expansions).filter((expansion) => expansions[expansion] && expansion !== STANDALONE_EXPANSION);
  return hasDune ? [...switchedOn, STANDALONE_EXPANSION] : switchedOn;
}

/** Whether two shortcuts can be needed in the same game; the stand-alone expansion never meets another one */
export function canMeet(first: HotkeyAction, second: HotkeyAction): boolean {
  if (first.expansion === undefined || second.expansion === undefined) {
    return true;
  }
  return (first.expansion === STANDALONE_EXPANSION) === (second.expansion === STANDALONE_EXPANSION);
}
