// Laptop keyboards for the shortcut dialog: German QWERTZ or US QWERTY, Mac or Windows modifiers, no number pad.
// value = KeyboardEvent.key of the key without Shift (letters uppercase, as in the bindings), shiftValue = with Shift.

export type KeyboardKey = {
  id: string;
  label: string;
  shiftLabel?: string;
  value?: string;
  shiftValue?: string;
  /** Width in key units (a letter key = 1) */
  width?: number;
  /** Modifier that stands for 'Mod' in the bindings (⌘ on Mac, Ctrl elsewhere) */
  mod?: boolean;
  /** Function row and the arrows up/down: half the height */
  half?: boolean;
};

/** A key or a column of two half keys stacked (arrow up over arrow down) */
export type KeyboardSlot = KeyboardKey | {stack: [KeyboardKey, KeyboardKey]};

export type KeyboardRow = ReadonlyArray<KeyboardSlot>;

function letters(text: string): Array<KeyboardKey> {
  return text.split('').map((letter) => ({id: letter, label: letter, value: letter}));
}

function symbol(id: string, label: string, shiftLabel?: string, width?: number): KeyboardKey {
  return {id, label, shiftLabel, value: label.length === 1 ? label.toUpperCase() : undefined, shiftValue: shiftLabel, width};
}

const FUNCTION_ROW: KeyboardRow = [
  {id: 'Escape', label: 'esc', value: 'Escape', width: 1.5, half: true},
  ...Array.from({length: 12}, (_, index) => ({id: 'F' + (index + 1), label: 'F' + (index + 1), value: 'F' + (index + 1), half: true})),
  {id: 'Power', label: '⏻', half: true},
];

const DIGITS = '1234567890'.split('');

function numberRow(shifted: ReadonlyArray<string>, first: KeyboardKey, last: ReadonlyArray<KeyboardKey>): KeyboardRow {
  return [first, ...DIGITS.map((digit, index) => symbol(digit, digit, shifted[index])), ...last, {id: 'Backspace', label: '⌫', value: 'Backspace', width: 1.5}];
}

function arrows(): KeyboardRow {
  return [
    {id: 'ArrowLeft', label: '←', value: 'ArrowLeft'},
    {stack: [{id: 'ArrowUp', label: '↑', value: 'ArrowUp', half: true}, {id: 'ArrowDown', label: '↓', value: 'ArrowDown', half: true}]},
    {id: 'ArrowRight', label: '→', value: 'ArrowRight'},
  ];
}

function bottomRow(mac: boolean): KeyboardRow {
  const space: KeyboardKey = {id: 'Space', label: '', value: ' ', width: 5};
  if (mac) {
    return [
      {id: 'Fn', label: 'fn'}, {id: 'Control', label: 'ctrl'}, {id: 'Alt', label: '⌥'},
      {id: 'Meta', label: '⌘', mod: true, width: 1.3}, space, {id: 'MetaRight', label: '⌘', mod: true, width: 1.3}, {id: 'AltRight', label: '⌥'},
      ...arrows(),
    ];
  }
  return [
    {id: 'Control', label: 'Ctrl', mod: true, width: 1.3}, {id: 'Fn', label: 'fn'}, {id: 'Windows', label: '⊞'}, {id: 'Alt', label: 'Alt'},
    space, {id: 'AltGraph', label: 'AltGr'}, {id: 'ControlRight', label: 'Ctrl', mod: true},
    ...arrows(),
  ];
}

/** German QWERTZ (Germany, Austria; also used in Hungary with other letters on the right) */
function qwertz(mac: boolean): ReadonlyArray<KeyboardRow> {
  return [
    FUNCTION_ROW,
    numberRow(['!', '"', '§', '$', '%', '&', '/', '(', ')', '='], symbol('Circumflex', '^', '°'), [symbol('ß', 'ß', '?'), symbol('Acute', '´', '`')]),
    [{id: 'Tab', label: '⇥', value: 'Tab', width: 1.5}, ...letters('QWERTZUIOP'), symbol('Ü', 'Ü'), symbol('Plus', '+', '*'), {id: 'Enter', label: '↵', value: 'Enter', width: 1.5}],
    [{id: 'CapsLock', label: '⇪', width: 1.8}, ...letters('ASDFGHJKL'), symbol('Ö', 'Ö'), symbol('Ä', 'Ä'), symbol('Hash', '#', '\''), {id: 'EnterLower', label: '', value: 'Enter', width: 1.2}],
    [{id: 'Shift', label: '⇧', width: 1.3}, symbol('Less', '<', '>'), ...letters('YXCVBNM'), symbol(',', ',', ';'), symbol('.', '.', ':'), symbol('Minus', '-', '_'), {id: 'ShiftRight', label: '⇧', width: 2.3}],
    bottomRow(mac),
  ];
}

/** US QWERTY */
function qwerty(mac: boolean): ReadonlyArray<KeyboardRow> {
  return [
    FUNCTION_ROW,
    numberRow(['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'], symbol('Backquote', '`', '~'), [symbol('Minus', '-', '_'), symbol('Equal', '=', '+')]),
    [{id: 'Tab', label: '⇥', value: 'Tab', width: 1.5}, ...letters('QWERTYUIOP'), symbol('BracketLeft', '[', '{'), symbol('BracketRight', ']', '}'), symbol('Backslash', '\\', '|', 1.5)],
    [{id: 'CapsLock', label: '⇪', width: 1.8}, ...letters('ASDFGHJKL'), symbol('Semicolon', ';', ':'), symbol('Quote', '\'', '"'), {id: 'Enter', label: '↵', value: 'Enter', width: 2.2}],
    [{id: 'Shift', label: '⇧', width: 2.3}, ...letters('ZXCVBNM'), symbol(',', ',', '<'), symbol('.', '.', '>'), symbol('Slash', '/', '?'), {id: 'ShiftRight', label: '⇧', width: 2.7}],
    bottomRow(mac),
  ];
}

// Languages whose usual keyboard is QWERTZ; all others get QWERTY
const QWERTZ_LANGUAGES = ['de', 'hu'];

export function keyboardLayout(language: string, mac: boolean): ReadonlyArray<KeyboardRow> {
  return QWERTZ_LANGUAGES.includes(language) ? qwertz(mac) : qwerty(mac);
}

export function isStack(slot: KeyboardSlot): slot is {stack: [KeyboardKey, KeyboardKey]} {
  return 'stack' in slot;
}
