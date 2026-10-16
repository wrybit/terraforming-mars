// Laptop keyboards for the shortcut dialog: German QWERTZ or US QWERTY, Mac or Windows modifiers, no number pad.
// value = KeyboardEvent.key of the key without Shift (letters uppercase, as in the bindings), shiftValue = with Shift,
// code = KeyboardEvent.code (the physical position). Default shortcuts are defined by position (hotkeyActions.ts), so
// the tab keys stay side by side on every layout; the layout tells which character lies there.

export type KeyboardKey = {
  id: string;
  code?: string;
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

// QWERTZ swaps Y and Z against the positions the codes are named after (US layout)
function letters(text: string, swapped = false): Array<KeyboardKey> {
  const swap: Record<string, string> = swapped ? {Y: 'Z', Z: 'Y'} : {};
  return text.split('').map((letter) => ({id: letter, code: 'Key' + (swap[letter] ?? letter), label: letter, value: letter}));
}

function symbol(id: string, code: string, label: string, shiftLabel?: string, width?: number): KeyboardKey {
  return {id, code, label, shiftLabel, value: label.length === 1 ? label.toUpperCase() : undefined, shiftValue: shiftLabel, width};
}

const FUNCTION_ROW: KeyboardRow = [
  {id: 'Escape', code: 'Escape', label: 'esc', value: 'Escape', width: 1.5, half: true},
  ...Array.from({length: 12}, (_, index) => ({id: 'F' + (index + 1), label: 'F' + (index + 1), value: 'F' + (index + 1), half: true})),
  {id: 'Power', label: '⏻', half: true},
];

const DIGITS = '1234567890'.split('');

function numberRow(shifted: ReadonlyArray<string>, first: KeyboardKey, last: ReadonlyArray<KeyboardKey>): KeyboardRow {
  return [first, ...DIGITS.map((digit, index) => symbol(digit, 'Digit' + digit, digit, shifted[index])), ...last, {id: 'Backspace', code: 'Backspace', label: '⌫', value: 'Backspace', width: 1.5}];
}

function arrows(): KeyboardRow {
  return [
    {id: 'ArrowLeft', code: 'ArrowLeft', label: '←', value: 'ArrowLeft'},
    {stack: [{id: 'ArrowUp', code: 'ArrowUp', label: '↑', value: 'ArrowUp', half: true}, {id: 'ArrowDown', code: 'ArrowDown', label: '↓', value: 'ArrowDown', half: true}]},
    {id: 'ArrowRight', code: 'ArrowRight', label: '→', value: 'ArrowRight'},
  ];
}

function bottomRow(mac: boolean): KeyboardRow {
  const space: KeyboardKey = {id: 'Space', code: 'Space', label: '', value: ' ', width: 5};
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
    numberRow(['!', '"', '§', '$', '%', '&', '/', '(', ')', '='], symbol('Circumflex', 'Backquote', '^', '°'), [symbol('ß', 'Minus', 'ß', '?'), symbol('Acute', 'Equal', '´', '`')]),
    [{id: 'Tab', code: 'Tab', label: '⇥', value: 'Tab', width: 1.5}, ...letters('QWERTZUIOP', true), symbol('Ü', 'BracketLeft', 'Ü'), symbol('Plus', 'BracketRight', '+', '*'), {id: 'Enter', code: 'Enter', label: '↵', value: 'Enter', width: 1.5}],
    [{id: 'CapsLock', label: '⇪', width: 1.8}, ...letters('ASDFGHJKL'), symbol('Ö', 'Semicolon', 'Ö'), symbol('Ä', 'Quote', 'Ä'), symbol('Hash', 'Backslash', '#', '\''), {id: 'EnterLower', code: 'Enter', label: '', value: 'Enter', width: 1.2}],
    [{id: 'Shift', label: '⇧', width: 1.3}, symbol('Less', 'IntlBackslash', '<', '>'), ...letters('YXCVBNM', true), symbol(',', 'Comma', ',', ';'), symbol('.', 'Period', '.', ':'), symbol('Minus', 'Slash', '-', '_'), {id: 'ShiftRight', label: '⇧', width: 2.3}],
    bottomRow(mac),
  ];
}

/** US QWERTY */
function qwerty(mac: boolean): ReadonlyArray<KeyboardRow> {
  return [
    FUNCTION_ROW,
    numberRow(['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'], symbol('Backquote', 'Backquote', '`', '~'), [symbol('Minus', 'Minus', '-', '_'), symbol('Equal', 'Equal', '=', '+')]),
    [{id: 'Tab', code: 'Tab', label: '⇥', value: 'Tab', width: 1.5}, ...letters('QWERTYUIOP'), symbol('BracketLeft', 'BracketLeft', '[', '{'), symbol('BracketRight', 'BracketRight', ']', '}'), symbol('Backslash', 'Backslash', '\\', '|', 1.5)],
    [{id: 'CapsLock', label: '⇪', width: 1.8}, ...letters('ASDFGHJKL'), symbol('Semicolon', 'Semicolon', ';', ':'), symbol('Quote', 'Quote', '\'', '"'), {id: 'Enter', code: 'Enter', label: '↵', value: 'Enter', width: 2.2}],
    [{id: 'Shift', label: '⇧', width: 2.3}, ...letters('ZXCVBNM'), symbol(',', 'Comma', ',', '<'), symbol('.', 'Period', '.', '>'), symbol('Slash', 'Slash', '/', '?'), {id: 'ShiftRight', label: '⇧', width: 2.7}],
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

/** Character on the key at a physical position (KeyboardEvent.code) in the layout of the language */
export function characterAt(code: string, language: string): string | undefined {
  for (const row of keyboardLayout(language, false)) {
    for (const slot of row) {
      const key = (isStack(slot) ? slot.stack : [slot]).find((candidate) => candidate.code === code);
      if (key !== undefined) {
        return key.value;
      }
    }
  }
  return undefined;
}
