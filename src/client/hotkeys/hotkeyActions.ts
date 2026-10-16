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
export type HotkeyGroup = 'general' | 'selection' | 'tabs' | 'tabs-default' | 'tabs-turn-end' | 'tabs-context' | 'tabs-expansion';

/** Expansion a tab only exists with; its shortcut is only listed in games with it */
export type HotkeyExpansion = 'turmoil' | 'colonies';

export type HotkeyAction = {
  id: string;
  group: HotkeyGroup;
  label: string;
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
  {id: 'confirm', group: 'selection', label: 'Binding – costs or ends', short: 'Binding', keys: ['Enter'], locked: true},
  {id: 'proceed', group: 'selection', label: 'Continue – everything else', short: 'Continue', keys: ['Space'], locked: true},
  {id: 'cancel', group: 'selection', label: 'Cancel / discard / no', short: 'Cancel', keys: ['Escape'], locked: true},
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

/** Expansions switched on in a game, for the shortcut dialog */
export function gameExpansions(expansions: Readonly<Record<string, boolean>>): Array<string> {
  return Object.keys(expansions).filter((expansion) => expansions[expansion]);
}
