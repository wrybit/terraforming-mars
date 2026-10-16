// Every keyboard shortcut of the game view: id, group in the help dialog, English label (translated like all texts)
// and the default keys. Locked shortcuts are fixed (Enter, Esc, digits …) and cannot be changed in the help dialog.

/** Keys of a shortcut: 'Mod' (⌘ on Mac, Ctrl elsewhere) plus one key as KeyboardEvent.key (letters uppercase) */
export type HotkeyKeys = ReadonlyArray<string>;

export type HotkeyGroup = 'general' | 'selection' | 'tabs';

export type HotkeyAction = {
  id: string;
  group: HotkeyGroup;
  label: string;
  keys: HotkeyKeys;
  /** Fixed key, shown in the dialog but not editable */
  locked?: boolean;
  /** Color of the label in the dialog, like the icon tabs pass on (green) and end generation (red) */
  tone?: 'success' | 'danger';
};

export const HOTKEY_ACTIONS: ReadonlyArray<HotkeyAction> = [
  {id: 'setup-menu', group: 'general', label: 'Setup menu', keys: ['Q']},
  {id: 'log-search', group: 'general', label: 'Search the log', keys: ['/']},
  {id: 'undo', group: 'general', label: 'Undo', keys: ['Mod', 'Z']},
  {id: 'rate-ai', group: 'general', label: 'Rate AI decision', keys: ['I']},
  {id: 'pick', group: 'selection', label: 'Choose card / option', keys: ['1', '…', '9'], locked: true},
  {id: 'select-all', group: 'selection', label: 'Select all', keys: ['Mod', 'A']},
  {id: 'amount', group: 'selection', label: 'Change amount', keys: ['←', '→'], locked: true},
  {id: 'confirm', group: 'selection', label: 'Confirm', keys: ['Enter'], locked: true},
  {id: 'cancel', group: 'selection', label: 'Cancel / discard / no', keys: ['Escape'], locked: true},
  {id: 'previous-tab', group: 'tabs', label: 'Previous tab', keys: [',']},
  {id: 'next-tab', group: 'tabs', label: 'Next tab', keys: ['.']},
  {id: 'tab-hand', group: 'tabs', label: 'All cards', keys: ['A']},
  {id: 'tab-milestone', group: 'tabs', label: 'Milestone', keys: ['M']},
  {id: 'tab-projects', group: 'tabs', label: 'Projects', keys: ['J']},
  {id: 'tab-award', group: 'tabs', label: 'Award', keys: ['U']},
  {id: 'tab-actions', group: 'tabs', label: 'Actions', keys: ['C']},
  {id: 'tab-corporation', group: 'tabs', label: 'Corporation action', keys: ['K']},
  {id: 'tab-standard', group: 'tabs', label: 'Standard', keys: ['S']},
  {id: 'tab-ceo', group: 'tabs', label: 'CEO action', keys: ['E']},
  {id: 'tab-sell', group: 'tabs', label: 'Sell', keys: ['V']},
  {id: 'tab-trade', group: 'tabs', label: 'Trade', keys: ['H']},
  {id: 'tab-place', group: 'tabs', label: 'Place', keys: ['P']},
  {id: 'tab-delegate', group: 'tabs', label: 'Delegate', keys: ['O']},
  {id: 'tab-temperature', group: 'tabs', label: 'Temperature', keys: ['T']},
  {id: 'tab-pass', group: 'tabs', label: 'Pass on', keys: ['W'], tone: 'success'},
  {id: 'tab-end', group: 'tabs', label: 'End generation', keys: ['B'], tone: 'danger'},
];

/** Shortcuts outside the game view, fixed and not listed in the help dialog */
export const FIXED_HOTKEYS: Readonly<Record<string, HotkeyKeys>> = {
  'create-game': ['Mod', 'Enter'],
  'help': ['?'],
};

export function findHotkeyAction(id: string): HotkeyAction | undefined {
  return HOTKEY_ACTIONS.find((action) => action.id === id);
}

export function defaultBindings(): Record<string, HotkeyKeys> {
  const bindings: Record<string, HotkeyKeys> = {};
  for (const action of HOTKEY_ACTIONS) {
    if (action.locked !== true) {
      bindings[action.id] = action.keys;
    }
  }
  return bindings;
}
